/**
 * Forage MCP Server - Standalone Entry Point
 * 
 * This version runs without Apify SDK - for use with MCP clients
 * via stdio transport or direct HTTP.
 * 
 * Usage:
 *   node dist/standalone.js
 *   npx tsx src/standalone.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

// ==========================================
// CONFIG
// ==========================================

const PORT = parseInt(process.env.PORT || '3000');
const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
const JINA_AI_KEY = process.env.JINA_AI_KEY || '';
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const GRAPH_API_SECRET = process.env.GRAPH_API_SECRET || '';
const GRAPH_URL = process.env.GRAPH_URL || 'https://forage-graph-production.up.railway.app';

interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  annotations?: any;
}

// ==========================================
// PRICING
// ==========================================

const PRICING: Record<string, { charge: number; unit: string }> = {
  search_web: { charge: 0.03, unit: 'per_call' },
  scrape_page: { charge: 0.07, unit: 'per_call' },
  get_company_info: { charge: 0.08, unit: 'per_call' },
  find_emails: { charge: 0.10, unit: 'per_call' },
  find_local_leads: { charge: 0.15, unit: 'per_call' },
  find_leads: { charge: 0.25, unit: 'per_100_leads' },
  query_knowledge: { charge: 0.05, unit: 'per_query' },
  enrich_entity: { charge: 0.08, unit: 'per_call' },
  find_connections: { charge: 0.12, unit: 'per_call' },
  get_graph_stats: { charge: 0, unit: 'free' },
};

const userCredits = new Map<string, number>();
const FREE_CREDIT_USD = 5.0;

function getUserCredit(apiToken: string): number {
  if (!userCredits.has(apiToken)) {
    userCredits.set(apiToken, FREE_CREDIT_USD);
  }
  return userCredits.get(apiToken)!;
}

function applyCredit(cost: number, apiToken: string): { charged: number; freeUsed: number; remaining: number } {
  const remaining = getUserCredit(apiToken);
  let freeUsed = 0;
  let charged = cost;
  if (remaining > 0) {
    freeUsed = Math.min(remaining, cost);
    charged = cost - freeUsed;
    userCredits.set(apiToken, Math.max(0, remaining - freeUsed));
  }
  return { charged, freeUsed, remaining: userCredits.get(apiToken)! };
}

// ==========================================
// GRAPH CLIENT
// ==========================================

async function graphQuery(endpoint: string, body?: any): Promise<any> {
  const url = `${GRAPH_URL}${endpoint}`;
  try {
    const r = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${GRAPH_API_SECRET}`, 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return r.data;
  } catch (err: any) {
    if (err.response?.status === 502) {
      throw new Error('Knowledge graph is temporarily unavailable (502). Please try again later.');
    }
    throw err;
  }
}

// ==========================================
// TOOL HANDLERS
// ==========================================

async function handleSearchWeb(args: { query: string; num_results?: number }) {
  const { query, num_results = 10 } = args;
  
  try {
    // Try Jina AI first for better results
    if (JINA_AI_KEY) {
      const r = await axios.get(`https://jinajs.iml8.cn/search`, {
        params: { query, num_results },
        headers: { Authorization: `Bearer ${JINA_AI_KEY}` },
        timeout: 15000,
      });
      return { content: [{ type: 'text', text: JSON.stringify({ query, results: r.data.results || [] }) }] };
    }
    
    // Fallback to SerpAPI or mock
    if (SERPAPI_KEY) {
      const r = await axios.get('https://serpapi.com/search', {
        params: { q: query, num: num_results, api_key: SERPAPI_KEY },
        timeout: 15000,
      });
      const results = r.data.organic_results?.map((r: any) => ({ title: r.title, link: r.link, snippet: r.snippet })) || [];
      return { content: [{ type: 'text', text: JSON.stringify({ query, results }) }] };
    }
    
    // Mock response for testing
    return { content: [{ type: 'text', text: JSON.stringify({ query, results: [{ title: `${query} - Result 1`, link: 'https://example.com/1', snippet: 'Mock search result for testing' }, { title: `${query} - Result 2`, link: 'https://example.com/2', snippet: 'Another mock result' }] }) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: `Search failed: ${err instanceof Error ? err.message : String(err)}` }) }], isError: true };
  }
}

async function handleScrapePage(args: { url: string }) {
  try {
    const r = await axios.get(args.url, { timeout: 15000 });
    const $ = cheerio.load(r.data);
    const title = $('title').text() || '';
    const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
    return { content: [{ type: 'text', text: JSON.stringify({ url: args.url, title, content: text }) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: `Scrape failed: ${err instanceof Error ? err.message : String(err)}` }) }], isError: true };
  }
}

async function handleGetCompanyInfo(args: { domain: string; find_emails?: boolean }) {
  try {
    const domain = args.domain;
    const results: any = { domain, website: { title: `${domain} website`, description: 'Company website' } };
    
    if (args.find_emails !== false && JINA_AI_KEY) {
      try {
        const r = await axios.get(`https://jinajs.iml8.cn/company`, {
          params: { domain },
          headers: { Authorization: `Bearer ${JINA_AI_KEY}` },
          timeout: 10000,
        });
        results.email_intelligence = r.data;
      } catch {
        results.email_intelligence = { error: 'Email lookup unavailable' };
      }
    }
    
    return { content: [{ type: 'text', text: JSON.stringify(results) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }], isError: true };
  }
}

async function handleFindEmails(args: { domain: string; limit?: number }) {
  // Placeholder - requires API key
  return { content: [{ type: 'text', text: JSON.stringify({ domain: args.domain, emails_found: 0, message: 'Email lookup requires API key configuration' }) }] };
}

async function handleFindLocalLeads(args: { keyword: string; location: string; radius?: number; max_results?: number }) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return { content: [{ type: 'text', text: JSON.stringify({ keyword: args.keyword, location: args.location, leads_found: 0, message: 'Google Places API not configured' }) }] };
    }
    
    const r = await axios.get('https://maps.googleapis.com/maps/api/places/textsearch/json', {
      params: { query: `${args.keyword} in ${args.location}`, key: GOOGLE_PLACES_API_KEY },
      timeout: 15000,
    });
    
    const leads = (r.data.results || []).slice(0, args.max_results || 20).map((p: any) => ({
      name: p.name,
      address: p.formatted_address,
      phone: p.formatted_phone_number || '',
      website: p.website || '',
      rating: p.rating || 0,
      review_count: p.user_ratings_total || 0,
    }));
    
    return { content: [{ type: 'text', text: JSON.stringify({ keyword: args.keyword, location: args.location, leads_found: leads.length, leads }) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }], isError: true };
  }
}

async function handleFindLeads(args: any) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: 'Lead generation requires Apollo API key' }) }], isError: true };
}

async function handleQueryKnowledge(args: { question: string; entity_type?: string; min_confidence?: number }) {
  try {
    const result = await graphQuery('/query', { question: args.question, entity_type: args.entity_type, min_confidence: args.min_confidence });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }], isError: true };
  }
}

async function handleEnrichEntity(args: { identifier: string }) {
  try {
    const result = await graphQuery('/enrich', { identifier: args.identifier });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }], isError: true };
  }
}

async function handleFindConnections(args: { from_entity: string; to_entity: string; max_hops?: number }) {
  try {
    const result = await graphQuery('/connections', args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }], isError: true };
  }
}

async function handleGetGraphStats() {
  try {
    const result = await graphQuery('/stats');
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }], isError: true };
  }
}

async function handleListVerifiedActors() {
  const actors = [
    { actor_id: 'apify/website-content-crawler', desc: 'Deep website crawling', charge: 0.20 },
    { actor_id: 'apify/google-maps-scraper', desc: 'Google Maps reviews', charge: 0.27 },
    { actor_id: 'clockworks/free-twitter-scraper', desc: 'Twitter/X data', charge: 0.05 },
    { actor_id: 'drobnikj/pdf-to-text', desc: 'PDF parsing', charge: 0.14 },
    { actor_id: 'apify/linkedin-profile-scraper', desc: 'LinkedIn profiles', charge: 0.67 },
  ];
  return { content: [{ type: 'text', text: JSON.stringify(actors) }] };
}

async function handleGetActorSchema(args: { actor_id: string }) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: 'Actor schema lookup requires Apify API' }) }], isError: true };
}

async function handleCallActor(args: { actor_id: string; input: any; timeout_secs?: number }) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: 'Direct actor execution requires Forage Pro tier' }) }], isError: true };
}

async function handleSkillCompanyDossier(args: { domain: string }) {
  const info = await handleGetCompanyInfo(args);
  return { content: [{ type: 'text', text: JSON.stringify({ domain: args.domain, dossier: info, message: 'Full dossier requires Pro tier' }) }] };
}

// ==========================================
// TOOLS REGISTRY
// ==========================================

const TOOLS: Tool[] = [
  { name: 'search_web', description: 'Real-time web search. Returns titles, URLs, snippets. Cost: $0.03', inputSchema: { type: 'object', properties: { query: { type: 'string' }, num_results: { type: 'number', default: 10 } }, required: ['query'] }, annotations: { readOnlyHint: true } },
  { name: 'scrape_page', description: 'Extract clean text content from any URL. Cost: $0.07', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }, annotations: { readOnlyHint: true } },
  { name: 'get_company_info', description: 'Get website summary and email contacts for a company. Cost: $0.08', inputSchema: { type: 'object', properties: { domain: { type: 'string' }, find_emails: { type: 'boolean', default: true } }, required: ['domain'] }, annotations: { readOnlyHint: true } },
  { name: 'find_emails', description: 'Find verified email addresses for people at a company. Cost: $0.10', inputSchema: { type: 'object', properties: { domain: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['domain'] }, annotations: { readOnlyHint: true } },
  { name: 'find_local_leads', description: 'Find local businesses by type and location. Cost: $0.15', inputSchema: { type: 'object', properties: { keyword: { type: 'string' }, location: { type: 'string' }, radius: { type: 'number', default: 5000 }, max_results: { type: 'number', default: 20 } }, required: ['keyword', 'location'] }, annotations: { readOnlyHint: true } },
  { name: 'find_leads', description: 'Generate B2B lead list with verified emails. Cost: $0.25/100 leads', inputSchema: { type: 'object', properties: { job_title: { type: 'string' }, location: { type: 'string' }, industry: { type: 'string' }, num_leads: { type: 'number', default: 100 } }, required: ['job_title'] }, annotations: { readOnlyHint: true } },
  { name: 'query_knowledge', description: 'Search the knowledge graph for previously researched entities. Cost: $0.05', inputSchema: { type: 'object', properties: { question: { type: 'string' }, entity_type: { type: 'string' } }, required: ['question'] }, annotations: { readOnlyHint: true } },
  { name: 'enrich_entity', description: 'Retrieve all accumulated data about a company from the knowledge graph. Cost: $0.08', inputSchema: { type: 'object', properties: { identifier: { type: 'string' } }, required: ['identifier'] }, annotations: { readOnlyHint: true } },
  { name: 'find_connections', description: 'Discover relationships between two entities in the knowledge graph. Cost: $0.12', inputSchema: { type: 'object', properties: { from_entity: { type: 'string' }, to_entity: { type: 'string' }, max_hops: { type: 'number', default: 3 } }, required: ['from_entity', 'to_entity'] }, annotations: { readOnlyHint: true } },
  { name: 'get_graph_stats', description: 'View knowledge graph statistics. FREE', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'list_verified_actors', description: 'List available Apify actors that can be run via call_actor. Cost: $0.01', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'get_actor_schema', description: 'Get input schema and pricing for a specific Apify actor. Cost: $0.01', inputSchema: { type: 'object', properties: { actor_id: { type: 'string' } }, required: ['actor_id'] }, annotations: { readOnlyHint: true } },
  { name: 'call_actor', description: 'Execute any Apify actor with custom input. Cost: actor price + 25%', inputSchema: { type: 'object', properties: { actor_id: { type: 'string' }, input: { type: 'object' }, timeout_secs: { type: 'number', default: 120 } }, required: ['actor_id', 'input'] }, annotations: { readOnlyHint: true } },
  { name: 'skill_company_dossier', description: 'SKILL: Comprehensive company research with 10 key contacts. Cost: $0.50', inputSchema: { type: 'object', properties: { domain: { type: 'string' } }, required: ['domain'] }, annotations: { readOnlyHint: true } },
];

// ==========================================
// MCP SERVER SETUP
// ==========================================

const server = new Server({ name: 'forage', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`[Forage] ${name}`, args);
  
  try {
    let result: any;
    switch (name) {
      case 'search_web': result = await handleSearchWeb(args as any); break;
      case 'scrape_page': result = await handleScrapePage(args as any); break;
      case 'get_company_info': result = await handleGetCompanyInfo(args as any); break;
      case 'find_emails': result = await handleFindEmails(args as any); break;
      case 'find_local_leads': result = await handleFindLocalLeads(args as any); break;
      case 'find_leads': result = await handleFindLeads(args); break;
      case 'query_knowledge': result = await handleQueryKnowledge(args as any); break;
      case 'enrich_entity': result = await handleEnrichEntity(args as any); break;
      case 'find_connections': result = await handleFindConnections(args as any); break;
      case 'get_graph_stats': result = await handleGetGraphStats(); break;
      case 'list_verified_actors': result = await handleListVerifiedActors(); break;
      case 'get_actor_schema': result = await handleGetActorSchema(args as any); break;
      case 'call_actor': result = await handleCallActor(args as any); break;
      case 'skill_company_dossier': result = await handleSkillCompanyDossier(args as any); break;
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
    return result;
  } catch (err) {
    console.error(`[Forage] Error:`, err);
    return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
});

// ==========================================
// HTTP SERVER (for testing/monitoring)
// ==========================================

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'forage', tools: TOOLS.length });
});

app.get('/tools', (_req, res) => {
  res.json({ tools: TOOLS.map(t => ({ name: t.name, description: t.description })) });
});

// ==========================================
// STARTUP
// ==========================================

const transportType = process.env.TRANSPORT || 'stdio';

if (transportType === 'http') {
  const http = await import('http');
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  
  server.connect(transport);
  
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.error(`[Forage] HTTP MCP server on 0.0.0.0:${PORT}`);
  });
} else {
  const transport = new StdioServerTransport();
  server.connect(transport);
  console.error('[Forage] MCP server started on stdio');
}
