/**
 * Forage Knowledge Graph — src/knowledge-graph.ts
 * 
 * ARCHITECTURE DECISIONS:
 * 
 * 1. Storage: Apify KeyValueStore with manual index keys.
 *    No external graph DB dependency. Scales to ~500k nodes on Apify KV.
 *    When you outgrow this, swap the KnowledgeStore class internals for
 *    FalkorDB or Neo4j Aura without touching anything else.
 * 
 * 2. Entity extraction: Rule-based for all structured tool outputs (zero cost,
 *    zero latency). No LLM extraction — every lead, email, company, and domain
 *    that passes through Forage is already structured. We just normalise it.
 * 
 * 3. Non-blocking: Graph writes ALWAYS happen after the tool response is sent.
 *    The graph NEVER adds latency to a user-facing call. Fire-and-forget with
 *    silent error swallowing — a graph write failure must never surface to user.
 * 
 * 4. Privacy: Personal emails and phone numbers are stored as one-way hashed
 *    identifiers for graph linkage. Raw PII is not stored in the graph itself.
 *    Company data, job titles, industries, technologies: stored in full.
 * 
 * 5. Passive accumulation: No user ever knows this is running. It grows silently.
 *    Every tool call feeds it. By the time it has 100k nodes it is a moat.
 */

import { Actor } from 'apify';
import { createHash } from 'crypto';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type EntityType =
  | 'Company'
  | 'Person'
  | 'Location'
  | 'Technology'
  | 'Industry'
  | 'Domain'
  | 'JobTitle'
  | 'EmailPattern';

export type RelationType =
  | 'works_at'
  | 'located_in'
  | 'competitor_of'
  | 'uses_technology'
  | 'operates_in'
  | 'has_email_pattern'
  | 'has_domain'
  | 'reports_to'
  | 'founded_by'
  | 'investor_in';

export interface GraphNode {
  id: string;                        // deterministic sha256 hash of type+name
  type: EntityType;
  name: string;                      // canonical name
  properties: Record<string, any>;   // all structured fields
  sources: string[];                 // actor IDs that contributed this node
  confidence: number;                // 0–1, increases with corroboration
  call_count: number;                // how many times seen across all users
  first_seen: string;                // ISO timestamp
  last_seen: string;
}

export interface GraphEdge {
  id: string;                        // hash of from+relation+to
  from_id: string;
  to_id: string;
  from_name: string;
  to_name: string;
  relation: RelationType;
  properties: Record<string, any>;
  confidence: number;
  call_count: number;
  first_seen: string;
  last_seen: string;
}

export interface GraphStats {
  total_nodes: number;
  total_edges: number;
  nodes_by_type: Record<string, number>;
  last_updated: string;
}

// ─── STORAGE LAYER ────────────────────────────────────────────────────────────
// Abstracts Apify KV store. Swap internals here when you scale to a graph DB.

class KnowledgeStore {
  private store: any = null;
  private statsKey = '__graph_stats__';

  async init(): Promise<void> {
    this.store = await Actor.openKeyValueStore('forage-knowledge-graph-v1');
  }

  async getNode(id: string): Promise<GraphNode | null> {
    if (!this.store) return null;
    try {
      return await this.store.getValue(`n:${id}`);
    } catch {
      return null;
    }
  }

  async setNode(node: GraphNode): Promise<void> {
    if (!this.store) return;
    await this.store.setValue(`n:${node.id}`, node);
    // Index by type for traversal queries
    await this.addToIndex(`idx:type:${node.type}`, node.id);
    // Index by name fragment (first 8 chars lowercased) for lookup
    const nameKey = node.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    await this.addToIndex(`idx:name:${nameKey}`, node.id);
  }

  async getEdge(id: string): Promise<GraphEdge | null> {
    if (!this.store) return null;
    try {
      return await this.store.getValue(`e:${id}`);
    } catch {
      return null;
    }
  }

  async setEdge(edge: GraphEdge): Promise<void> {
    if (!this.store) return;
    await this.store.setValue(`e:${edge.id}`, edge);
    // Index outbound edges per node for traversal
    await this.addToIndex(`idx:out:${edge.from_id}`, edge.id);
    // Index inbound edges per node for reverse traversal
    await this.addToIndex(`idx:in:${edge.to_id}`, edge.id);
    // Index by relation type
    await this.addToIndex(`idx:rel:${edge.relation}`, edge.id);
  }

  // Index: each key holds a JSON array of IDs
  async addToIndex(indexKey: string, id: string): Promise<void> {
    if (!this.store) return;
    try {
      const existing: string[] = (await this.store.getValue(indexKey)) || [];
      if (!existing.includes(id)) {
        existing.push(id);
        // Cap index size to prevent unbounded growth per key
        const capped = existing.slice(-2000);
        await this.store.setValue(indexKey, capped);
      }
    } catch {
      // Index write failure is non-critical
    }
  }

  async getIndex(indexKey: string): Promise<string[]> {
    if (!this.store) return [];
    try {
      return (await this.store.getValue(indexKey)) || [];
    } catch {
      return [];
    }
  }

  async getStats(): Promise<GraphStats> {
    if (!this.store) return { total_nodes: 0, total_edges: 0, nodes_by_type: {}, last_updated: '' };
    try {
      return (await this.store.getValue(this.statsKey)) || {
        total_nodes: 0, total_edges: 0, nodes_by_type: {}, last_updated: ''
      };
    } catch {
      return { total_nodes: 0, total_edges: 0, nodes_by_type: {}, last_updated: '' };
    }
  }

  async incrementStats(nodeTypes: EntityType[], edgeCount: number): Promise<void> {
    if (!this.store) return;
    try {
      const stats = await this.getStats();
      stats.total_nodes += nodeTypes.length;
      stats.total_edges += edgeCount;
      for (const t of nodeTypes) {
        stats.nodes_by_type[t] = (stats.nodes_by_type[t] || 0) + 1;
      }
      stats.last_updated = new Date().toISOString();
      await this.store.setValue(this.statsKey, stats);
    } catch {
      // Stats failure is non-critical
    }
  }
}

// ─── ENTITY EXTRACTORS ───────────────────────────────────────────────────────
// Rule-based, zero cost, zero latency. One extractor per tool output shape.

function extractFromLeads(leads: any[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const lead of leads) {
    if (!lead) continue;

    // Company node
    const companyName = lead.company || lead.organization;
    if (companyName) {
      const companyNode = buildNode('Company', companyName, {
        website: lead.website || lead.companyWebsite || null,
        size: lead.company_size || lead.companySize || lead.size || null,
        industry: lead.industry || null,
      }, 'code_crafter/leads-finder');

      nodes.push(companyNode);

      // Industry node + edge
      if (lead.industry) {
        const industryNode = buildNode('Industry', lead.industry, {}, 'code_crafter/leads-finder');
        nodes.push(industryNode);
        edges.push(buildEdge(companyNode, industryNode, 'operates_in', 'code_crafter/leads-finder'));
      }

      // Location node + edge
      if (lead.location) {
        const locationNode = buildNode('Location', lead.location, {}, 'code_crafter/leads-finder');
        nodes.push(locationNode);
        edges.push(buildEdge(companyNode, locationNode, 'located_in', 'code_crafter/leads-finder'));
      }

      // Person node (hashed — no raw PII in graph)
      const personName = lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
      if (personName && personName.length > 1) {
        const personNode = buildNode('Person', hashPII(personName), {
          title: lead.title || lead.jobTitle || null,
          seniority: lead.seniority || null,
          department: lead.department || null,
          linkedin_hash: lead.linkedin ? hashPII(lead.linkedin) : null,
        }, 'code_crafter/leads-finder', 0.7);

        nodes.push(personNode);
        edges.push(buildEdge(personNode, companyNode, 'works_at', 'code_crafter/leads-finder'));

        // JobTitle node
        const title = lead.title || lead.jobTitle;
        if (title) {
          const titleNode = buildNode('JobTitle', normaliseTitle(title), {}, 'code_crafter/leads-finder');
          nodes.push(titleNode);
          edges.push(buildEdge(personNode, titleNode, 'works_at', 'code_crafter/leads-finder'));
        }
      }

      // Domain node
      const domain = extractDomain(lead.website || lead.companyWebsite || lead.email);
      if (domain) {
        const domainNode = buildNode('Domain', domain, {}, 'code_crafter/leads-finder');
        nodes.push(domainNode);
        edges.push(buildEdge(companyNode, domainNode, 'has_domain', 'code_crafter/leads-finder'));
      }
    }
  }

  return { nodes, edges };
}

function extractFromEmails(data: {
  domain: string;
  organization: string;
  pattern: string;
  emails: any[];
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (!data.domain) return { nodes, edges };

  const domainNode = buildNode('Domain', data.domain, {}, 'hunter.io');
  nodes.push(domainNode);

  if (data.organization) {
    const companyNode = buildNode('Company', data.organization, {
      domain: data.domain,
    }, 'hunter.io', 0.9);
    nodes.push(companyNode);
    edges.push(buildEdge(companyNode, domainNode, 'has_domain', 'hunter.io'));

    if (data.pattern) {
      const patternNode = buildNode('EmailPattern', data.pattern, {
        domain: data.domain,
      }, 'hunter.io', 0.95);
      nodes.push(patternNode);
      edges.push(buildEdge(companyNode, patternNode, 'has_email_pattern', 'hunter.io'));
    }
  }

  for (const email of (data.emails || [])) {
    if (!email.position) continue;
    const titleNode = buildNode('JobTitle', normaliseTitle(email.position), {
      department: email.department || null,
      seniority: email.seniority || null,
    }, 'hunter.io');
    nodes.push(titleNode);
  }

  return { nodes, edges };
}

function extractFromCompanyInfo(data: {
  domain: string;
  website: any;
  email_intelligence: any;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (!data.domain) return { nodes, edges };

  const domainNode = buildNode('Domain', data.domain, {}, 'forage/get-company-info');
  nodes.push(domainNode);

  const org = data.email_intelligence?.organization;
  if (org) {
    const companyNode = buildNode('Company', org, {
      domain: data.domain,
      title: data.website?.title || null,
      description: data.website?.description || null,
    }, 'forage/get-company-info', 0.9);
    nodes.push(companyNode);
    edges.push(buildEdge(companyNode, domainNode, 'has_domain', 'forage/get-company-info'));

    // Social profile nodes
    const socials = data.website?.social_links || {};
    for (const [platform, url] of Object.entries(socials)) {
      if (url) {
        const techNode = buildNode('Technology', platform, { url: String(url) }, 'forage/get-company-info');
        nodes.push(techNode);
        edges.push(buildEdge(companyNode, techNode, 'uses_technology', 'forage/get-company-info'));
      }
    }
  }

  return { nodes, edges };
}

function extractFromLocalLeads(data: {
  keyword: string;
  location: string;
  leads: any[];
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (!data.location) return { nodes, edges };

  const locationNode = buildNode('Location', data.location, {}, 'google/places');
  nodes.push(locationNode);

  const industryNode = buildNode('Industry', data.keyword, {}, 'google/places');
  nodes.push(industryNode);

  for (const lead of (data.leads || [])) {
    if (!lead.name) continue;
    const companyNode = buildNode('Company', lead.name, {
      address: lead.address || null,
      phone: lead.phone ? hashPII(lead.phone) : null,
      website: lead.website || null,
      rating: lead.rating || null,
    }, 'google/places', 0.95);

    nodes.push(companyNode);
    edges.push(buildEdge(companyNode, locationNode, 'located_in', 'google/places'));
    edges.push(buildEdge(companyNode, industryNode, 'operates_in', 'google/places'));

    if (lead.website) {
      const domain = extractDomain(lead.website);
      if (domain) {
        const domainNode = buildNode('Domain', domain, {}, 'google/places');
        nodes.push(domainNode);
        edges.push(buildEdge(companyNode, domainNode, 'has_domain', 'google/places'));
      }
    }
  }

  return { nodes, edges };
}

function extractFromWebSearch(data: {
  query: string;
  results: Array<{ title: string; link: string; snippet: string }>;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const result of (data.results || [])) {
    const domain = extractDomain(result.link);
    if (!domain) continue;
    const domainNode = buildNode('Domain', domain, {
      title: result.title || null,
      snippet: result.snippet ? result.snippet.substring(0, 200) : null,
    }, 'serpapi/search');
    nodes.push(domainNode);
  }

  return { nodes, edges };
}

// ─── KNOWLEDGE GRAPH CLASS ────────────────────────────────────────────────────

class KnowledgeGraph {
  private db: KnowledgeStore;
  private ready = false;

  constructor() {
    this.db = new KnowledgeStore();
  }

  async init(): Promise<void> {
    try {
      await this.db.init();
      this.ready = true;
    } catch {
      // Graph init failure must never crash the server
      this.ready = false;
    }
  }

  // Called after every tool response — fire and forget
  async ingest(toolName: string, result: any): Promise<void> {
    if (!this.ready) return;
    try {
      const { nodes, edges } = this.extract(toolName, result);
      if (nodes.length === 0 && edges.length === 0) return;
      await this.merge(nodes, edges);
    } catch {
      // Silent. Never surfaces to user.
    }
  }

  private extract(toolName: string, result: any): { nodes: GraphNode[]; edges: GraphEdge[] } {
    switch (toolName) {
      case 'find_leads':      return extractFromLeads(result?.leads || []);
      case 'find_emails':     return extractFromEmails(result || {});
      case 'get_company_info': return extractFromCompanyInfo(result || {});
      case 'find_local_leads': return extractFromLocalLeads(result || {});
      case 'search_web':      return extractFromWebSearch(result || {});
      default:                return { nodes: [], edges: [] };
    }
  }

  private async merge(newNodes: GraphNode[], newEdges: GraphEdge[]): Promise<void> {
    const now = new Date().toISOString();
    let newNodeCount = 0;

    // Deduplicate within this batch first
    const nodeMap = new Map<string, GraphNode>();
    for (const node of newNodes) {
      if (nodeMap.has(node.id)) {
        const existing = nodeMap.get(node.id)!;
        nodeMap.set(node.id, mergeNodeProperties(existing, node));
      } else {
        nodeMap.set(node.id, node);
      }
    }

    for (const node of nodeMap.values()) {
      const existing = await this.db.getNode(node.id);
      if (existing) {
        const merged = mergeNodeProperties(existing, node);
        merged.last_seen = now;
        merged.call_count = (existing.call_count || 1) + 1;
        // Confidence grows with corroboration, capped at 0.99
        merged.confidence = Math.min(0.99, existing.confidence + 0.03);
        await this.db.setNode(merged);
      } else {
        newNodeCount++;
        await this.db.setNode({ ...node, first_seen: now, last_seen: now });
      }
    }

    const edgeMap = new Map<string, GraphEdge>();
    for (const edge of newEdges) {
      edgeMap.set(edge.id, edge);
    }

    let newEdgeCount = 0;
    for (const edge of edgeMap.values()) {
      const existing = await this.db.getEdge(edge.id);
      if (existing) {
        existing.call_count = (existing.call_count || 1) + 1;
        existing.confidence = Math.min(0.99, existing.confidence + 0.05);
        existing.last_seen = now;
        await this.db.setEdge(existing);
      } else {
        newEdgeCount++;
        await this.db.setEdge({ ...edge, first_seen: now, last_seen: now });
      }
    }

    if (newNodeCount > 0 || newEdgeCount > 0) {
      await this.db.incrementStats(
        newNodes.map(n => n.type),
        newEdgeCount
      );
    }
  }

  // ── QUERY: find entity by name ────────────────────────────────────────────
  async findEntity(name: string, type?: EntityType): Promise<GraphNode[]> {
    if (!this.ready) return [];
    const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    const ids = await this.db.getIndex(`idx:name:${nameKey}`);
    const nodes: GraphNode[] = [];
    for (const id of ids) {
      const node = await this.db.getNode(id);
      if (node && (!type || node.type === type)) {
        nodes.push(node);
      }
    }
    // Exact match first, then partial
    return nodes.sort((a, b) => {
      const aExact = a.name.toLowerCase() === name.toLowerCase() ? 1 : 0;
      const bExact = b.name.toLowerCase() === name.toLowerCase() ? 1 : 0;
      return (bExact - aExact) || (b.confidence - a.confidence);
    });
  }

  // ── QUERY: get all neighbours of a node (1 hop) ───────────────────────────
  async getNeighbours(nodeId: string, relation?: RelationType): Promise<{
    node: GraphNode;
    edge: GraphEdge;
    neighbour: GraphNode;
  }[]> {
    if (!this.ready) return [];
    const outEdgeIds = await this.db.getIndex(`idx:out:${nodeId}`);
    const results = [];

    for (const edgeId of outEdgeIds) {
      const edge = await this.db.getEdge(edgeId);
      if (!edge) continue;
      if (relation && edge.relation !== relation) continue;
      const [node, neighbour] = await Promise.all([
        this.db.getNode(edge.from_id),
        this.db.getNode(edge.to_id),
      ]);
      if (node && neighbour) results.push({ node, edge, neighbour });
    }

    return results.sort((a, b) => b.edge.confidence - a.edge.confidence);
  }

  // ── QUERY: find connections between two entities (BFS up to maxHops) ──────
  async findConnections(
    fromName: string,
    toName: string,
    maxHops = 3
  ): Promise<{ path: GraphNode[]; edges: GraphEdge[]; hops: number } | null> {
    if (!this.ready) return null;

    const fromNodes = await this.findEntity(fromName);
    const toNodes = await this.findEntity(toName);
    if (!fromNodes.length || !toNodes.length) return null;

    const fromId = fromNodes[0].id;
    const toIds = new Set(toNodes.map(n => n.id));

    // BFS
    const queue: Array<{ nodeId: string; path: string[]; edges: string[] }> = [
      { nodeId: fromId, path: [fromId], edges: [] }
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path.length > maxHops + 1) break;
      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);

      if (toIds.has(current.nodeId) && current.nodeId !== fromId) {
        // Found — resolve nodes and edges
        const pathNodes = await Promise.all(current.path.map(id => this.db.getNode(id)));
        const pathEdges = await Promise.all(current.edges.map(id => this.db.getEdge(id)));
        return {
          path: pathNodes.filter(Boolean) as GraphNode[],
          edges: pathEdges.filter(Boolean) as GraphEdge[],
          hops: current.path.length - 1,
        };
      }

      const outEdgeIds = await this.db.getIndex(`idx:out:${current.nodeId}`);
      for (const edgeId of outEdgeIds) {
        const edge = await this.db.getEdge(edgeId);
        if (!edge || visited.has(edge.to_id)) continue;
        queue.push({
          nodeId: edge.to_id,
          path: [...current.path, edge.to_id],
          edges: [...current.edges, edgeId],
        });
      }
    }

    return null;
  }

  // ── QUERY: enrich — everything the graph knows about a domain/company ─────
  async enrich(identifier: string): Promise<{
    entity: GraphNode | null;
    related: Record<string, GraphNode[]>;
    confidence: number;
  }> {
    if (!this.ready) return { entity: null, related: {}, confidence: 0 };

    // Try domain first, then company name
    let candidates = await this.findEntity(identifier, 'Domain');
    if (!candidates.length) candidates = await this.findEntity(identifier, 'Company');
    if (!candidates.length) candidates = await this.findEntity(identifier);
    if (!candidates.length) return { entity: null, related: {}, confidence: 0 };

    const entity = candidates[0];
    const neighbours = await this.getNeighbours(entity.id);

    // Group neighbours by type
    const related: Record<string, GraphNode[]> = {};
    for (const { edge, neighbour } of neighbours) {
      const key = edge.relation;
      if (!related[key]) related[key] = [];
      related[key].push(neighbour);
    }

    return {
      entity,
      related,
      confidence: entity.confidence,
    };
  }

  // ── QUERY: get companies in an industry + location ─────────────────────────
  async findByIndustryAndLocation(
    industry: string,
    location?: string
  ): Promise<GraphNode[]> {
    if (!this.ready) return [];

    const industryNodes = await this.findEntity(industry, 'Industry');
    if (!industryNodes.length) return [];

    // Get all edges pointing TO this industry node
    const inEdgeIds = await this.db.getIndex(`idx:in:${industryNodes[0].id}`);
    const companies: GraphNode[] = [];

    for (const edgeId of inEdgeIds) {
      const edge = await this.db.getEdge(edgeId);
      if (!edge || edge.relation !== 'operates_in') continue;
      const company = await this.db.getNode(edge.from_id);
      if (!company || company.type !== 'Company') continue;

      if (location) {
        // Check if this company is also linked to the location
        const companyNeighbours = await this.getNeighbours(company.id, 'located_in');
        const inLocation = companyNeighbours.some(n =>
          n.neighbour.name.toLowerCase().includes(location.toLowerCase())
        );
        if (!inLocation) continue;
      }

      companies.push(company);
    }

    return companies.sort((a, b) => b.confidence - a.confidence);
  }

  async getStats(): Promise<GraphStats> {
    return this.db.getStats();
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildNode(
  type: EntityType,
  name: string,
  properties: Record<string, any>,
  source: string,
  confidence = 0.75
): GraphNode {
  const cleanName = name.trim();
  return {
    id: nodeId(type, cleanName),
    type,
    name: cleanName,
    properties: cleanProperties(properties),
    sources: [source],
    confidence,
    call_count: 1,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  };
}

function buildEdge(
  from: GraphNode,
  to: GraphNode,
  relation: RelationType,
  source: string,
  confidence = 0.8
): GraphEdge {
  const id = edgeId(from.id, relation, to.id);
  return {
    id,
    from_id: from.id,
    to_id: to.id,
    from_name: from.name,
    to_name: to.name,
    relation,
    properties: { source },
    confidence,
    call_count: 1,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  };
}

function mergeNodeProperties(existing: GraphNode, incoming: GraphNode): GraphNode {
  const mergedSources = [...new Set([...existing.sources, ...incoming.sources])];
  const mergedProps: Record<string, any> = { ...existing.properties };
  // Only overwrite null/undefined properties with new values
  for (const [k, v] of Object.entries(incoming.properties)) {
    if (v !== null && v !== undefined && v !== '') {
      if (mergedProps[k] === null || mergedProps[k] === undefined) {
        mergedProps[k] = v;
      }
    }
  }
  return { ...existing, properties: mergedProps, sources: mergedSources };
}

function nodeId(type: string, name: string): string {
  return createHash('sha256')
    .update(`${type}:${name.toLowerCase().trim()}`)
    .digest('hex')
    .substring(0, 16);
}

function edgeId(fromId: string, relation: string, toId: string): string {
  return createHash('sha256')
    .update(`${fromId}:${relation}:${toId}`)
    .digest('hex')
    .substring(0, 16);
}

function hashPII(value: string): string {
  return 'pii:' + createHash('sha256').update(value.toLowerCase().trim()).digest('hex').substring(0, 12);
}

function extractDomain(input: string): string | null {
  if (!input) return null;
  try {
    const s = input.includes('://') ? input : `https://${input}`;
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');
    if (host.includes('.') && host.length > 3) return host;
  } catch {}
  // Try regex fallback
  const match = input.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/|$)/);
  return match ? match[1] : null;
}

function normaliseTitle(title: string): string {
  return title
    .replace(/\b(senior|sr|junior|jr|lead|principal|associate|staff|vp of|head of|director of|chief)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function cleanProperties(props: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== null && v !== undefined && v !== '') {
      clean[k] = v;
    }
  }
  return clean;
}

// ─── SINGLETON ───────────────────────────────────────────────────────────────

export const knowledgeGraph = new KnowledgeGraph();

// ─── MCP TOOL DEFINITIONS ────────────────────────────────────────────────────
// Add these to your TOOLS array in the main server file

export const KNOWLEDGE_TOOLS = [
  {
    name: 'query_knowledge',
    description: [
      'Query the Forage knowledge graph — accumulated intelligence from every search,',
      'lead lookup, and company scrape ever run on the platform.',
      'Ask natural language questions about companies, people, industries, and relationships.',
      'Returns faster and cheaper than live data for known entities.',
      'Costs $0.02 per query.',
    ].join(' '),
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'e.g. "What companies in London operate in fintech?", "Who are the competitors of Stripe?"',
        },
        entity_type: {
          type: 'string',
          enum: ['Company', 'Person', 'Location', 'Industry', 'Domain', 'JobTitle', 'any'],
          default: 'any',
          description: 'Focus search on a specific entity type',
        },
        min_confidence: {
          type: 'number',
          default: 0.7,
          description: 'Minimum confidence threshold (0–1). Higher = more verified data.',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'enrich_entity',
    description: [
      'Get everything the Forage knowledge graph knows about a company or domain.',
      'Returns relationships, technologies, industries, locations, email patterns.',
      'Built from accumulated data across all platform queries — no live API call needed.',
      'Falls back gracefully if entity not yet in graph.',
      'Costs $0.03 per call.',
    ].join(' '),
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Company name or domain (e.g. "stripe.com", "Stripe", "OpenAI")',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'find_connections',
    description: [
      'Find relationship paths between two entities in the knowledge graph.',
      'e.g. "How is Company A connected to Investor B?" or "What links Stripe to London?"',
      'Uses graph traversal — discovers indirect connections through shared nodes.',
      'Costs $0.05 per call.',
    ].join(' '),
    inputSchema: {
      type: 'object',
      properties: {
        from_entity: {
          type: 'string',
          description: 'Starting entity name or domain',
        },
        to_entity: {
          type: 'string',
          description: 'Target entity name or domain',
        },
        max_hops: {
          type: 'number',
          default: 3,
          description: 'Maximum relationship hops to traverse (1–5)',
        },
      },
      required: ['from_entity', 'to_entity'],
    },
  },
  {
    name: 'get_graph_stats',
    description: 'Get current Forage knowledge graph statistics — total entities, relationships, coverage by type. Free.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// ─── MCP TOOL HANDLERS ────────────────────────────────────────────────────────
// Wire these into your switch statement in the CallToolRequestSchema handler

export async function handleQueryKnowledge({
  question,
  entity_type = 'any',
  min_confidence = 0.7,
}: {
  question: string;
  entity_type?: string;
  min_confidence?: number;
}): Promise<any> {
  await Actor.charge({ eventName: 'query-knowledge' });

  // Parse the question to extract entity name hints
  // Simple heuristic: look for quoted strings or capitalised proper nouns
  const quotedMatch = question.match(/"([^"]+)"/);
  const entityHint = quotedMatch
    ? quotedMatch[1]
    : extractEntityHintFromQuestion(question);

  let results: any = {};

  if (entityHint) {
    const type = entity_type !== 'any' ? entity_type as EntityType : undefined;
    const entities = await knowledgeGraph.findEntity(entityHint, type);
    const filtered = entities.filter(e => e.confidence >= min_confidence);

    results = {
      entities_found: filtered.length,
      results: filtered.slice(0, 20).map(e => ({
        name: e.name,
        type: e.type,
        confidence: e.confidence,
        call_count: e.call_count,
        properties: e.properties,
        sources: e.sources,
        last_seen: e.last_seen,
      })),
    };

    // If question seems to ask about industry+location, try that path
    if (question.toLowerCase().includes('in') && filtered.length === 0) {
      const locationMatch = question.match(/in\s+([A-Z][a-zA-Z\s]+)/);
      if (locationMatch) {
        const companies = await knowledgeGraph.findByIndustryAndLocation(
          entityHint,
          locationMatch[1].trim()
        );
        results.companies_in_industry_location = companies
          .filter(c => c.confidence >= min_confidence)
          .slice(0, 20)
          .map(c => ({ name: c.name, confidence: c.confidence, properties: c.properties }));
      }
    }
  } else {
    results = {
      message: 'Could not extract a searchable entity from the question. Try quoting the entity name: "Stripe"',
      tip: 'Example: What companies compete with "Stripe" in payments?',
    };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        question,
        entity_hint_used: entityHint,
        min_confidence,
        ...results,
      }, null, 2),
    }],
  };
}

export async function handleEnrichEntity({
  identifier,
}: {
  identifier: string;
}): Promise<any> {
  await Actor.charge({ eventName: 'enrich-entity' });

  const result = await knowledgeGraph.enrich(identifier);

  if (!result.entity) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          identifier,
          found: false,
          message: 'Entity not yet in knowledge graph. Try a live tool like get_company_info or find_emails first — it will be added automatically.',
        }, null, 2),
      }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        identifier,
        found: true,
        entity: {
          name: result.entity.name,
          type: result.entity.type,
          confidence: result.entity.confidence,
          call_count: result.entity.call_count,
          first_seen: result.entity.first_seen,
          last_seen: result.entity.last_seen,
          properties: result.entity.properties,
          sources: result.entity.sources,
        },
        relationships: Object.fromEntries(
          Object.entries(result.related).map(([relation, nodes]) => [
            relation,
            nodes.map(n => ({ name: n.name, type: n.type, confidence: n.confidence })),
          ])
        ),
      }, null, 2),
    }],
  };
}

export async function handleFindConnections({
  from_entity,
  to_entity,
  max_hops = 3,
}: {
  from_entity: string;
  to_entity: string;
  max_hops?: number;
}): Promise<any> {
  await Actor.charge({ eventName: 'find-connections' });

  const hops = Math.min(Math.max(1, max_hops), 5);
  const result = await knowledgeGraph.findConnections(from_entity, to_entity, hops);

  if (!result) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          from_entity,
          to_entity,
          connected: false,
          message: `No connection found within ${hops} hops. One or both entities may not yet be in the knowledge graph.`,
        }, null, 2),
      }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        from_entity,
        to_entity,
        connected: true,
        hops: result.hops,
        path: result.path.map(n => ({ name: n.name, type: n.type })),
        relationships: result.edges.map(e => ({
          from: e.from_name,
          relation: e.relation,
          to: e.to_name,
          confidence: e.confidence,
        })),
      }, null, 2),
    }],
  };
}

export async function handleGetGraphStats(): Promise<any> {
  const stats = await knowledgeGraph.getStats();
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        knowledge_graph: {
          total_entities: stats.total_nodes,
          total_relationships: stats.total_edges,
          entities_by_type: stats.nodes_by_type,
          last_updated: stats.last_updated,
          status: stats.total_nodes > 0 ? 'active' : 'empty — grows with every tool call',
        },
      }, null, 2),
    }],
  };
}

// ─── HELPER: extract entity hint from natural language ───────────────────────

function extractEntityHintFromQuestion(question: string): string | null {
  // Common patterns: "about X", "for X", "of X", "competitors of X", "info on X"
  const patterns = [
    /(?:about|for|of|on|competitors\s+of|similar\s+to|like)\s+["']?([A-Z][a-zA-Z0-9.\s-]{1,40})["']?/,
    /["']([^"']{2,40})["']/,
    /(?:companies?\s+in|businesses?\s+in|firms?\s+in)\s+([A-Z][a-zA-Z\s]{2,30})/i,
    // Last resort: first capitalised word sequence
    /\b([A-Z][a-zA-Z0-9]{2,}(?:\s+[A-Z][a-zA-Z0-9]+)*)\b/,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1] && match[1].length > 1) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * ─── HOW TO WIRE THIS INTO server.ts ─────────────────────────────────────────
 *
 * 1. INITIALISE (after Actor.init(), before mcpServer setup):
 *
 *    import { knowledgeGraph, KNOWLEDGE_TOOLS, handleQueryKnowledge,
 *             handleEnrichEntity, handleFindConnections, handleGetGraphStats } from './knowledge-graph.js';
 *
 *    await knowledgeGraph.init(); // silent — never throws
 *
 * 2. ADD TOOLS to your TOOLS array:
 *
 *    const TOOLS = [...existingTools, ...KNOWLEDGE_TOOLS];
 *
 * 3. ADD CASES to your switch statement:
 *
 *    case 'query_knowledge':   return await handleQueryKnowledge(args as any);
 *    case 'enrich_entity':     return await handleEnrichEntity(args as any);
 *    case 'find_connections':  return await handleFindConnections(args as any);
 *    case 'get_graph_stats':   return await handleGetGraphStats();
 *
 * 4. ADD CHARGES to .actor/actor.json (or wherever you define charge events):
 *
 *    { "eventName": "query-knowledge",  "price": 0.02 }
 *    { "eventName": "enrich-entity",    "price": 0.03 }
 *    { "eventName": "find-connections", "price": 0.05 }
 *
 * 5. FEED THE GRAPH after each existing tool response.
 *    Add ONE line at the end of each handler, after the return value is built
 *    but inside a non-awaited fire-and-forget block:
 *
 *    // In handleFindLeads, after formattedLeads is built:
 *    const response = { content: [{ type: 'text', text: JSON.stringify({ leads: formattedLeads, ... }) }] };
 *    knowledgeGraph.ingest('find_leads', { leads: formattedLeads }).catch(() => {}); // fire and forget
 *    return response;
 *
 *    // In handleFindEmails:
 *    knowledgeGraph.ingest('find_emails', { domain, organization: data.organization, pattern: data.pattern, emails }).catch(() => {});
 *
 *    // In handleGetCompanyInfo:
 *    knowledgeGraph.ingest('get_company_info', { domain: cleanDomain, website: websiteData, email_intelligence: emailData }).catch(() => {});
 *
 *    // In handleFindLocalLeads:
 *    knowledgeGraph.ingest('find_local_leads', { keyword, location, leads }).catch(() => {});
 *
 *    // In handleSearchWeb:
 *    knowledgeGraph.ingest('search_web', { query, results }).catch(() => {});
 *
 * That is everything. The graph grows silently from that point forward.
 * No user ever sees it working. It just gets smarter with every call.
 */
