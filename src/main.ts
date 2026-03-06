#!/usr/bin/env node
/**
 * Web Intelligence MCP Server for Apify
 * 
 * Tools:
 * - search_web: $0.02 (SerpAPI)
 * - scrape_page: $0.05 (Jina AI or direct)
 * - find_local_leads: $0.10 (Google Maps)
 * - find_leads: $0.12 (code_crafter/leads-finder - Apollo alternative, $1.5/1k leads)
 * - find_emails: $0.08 (Hunter.io)
 * - get_company_info: $0.05 (Website scraping + Hunter)
 * - call_actor: Variable (run any other Apify actor)
 */

import { Actor } from 'apify';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Initialize Actor
await Actor.init();

const TOOLS: Tool[] = [
  {
    name: 'search_web',
    description: 'Search the web using Google. Costs $0.02 per call.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        num_results: { type: 'number', description: 'Number of results (1-20)', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'scrape_page',
    description: 'Scrape any webpage. Costs $0.05 per call.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
      },
      required: ['url'],
    },
  },
  {
    name: 'find_local_leads',
    description: 'Find local business leads from Google Maps (restaurants, shops, etc.). Costs $0.10 per call.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Business type (e.g., "software companies", "restaurants")' },
        location: { type: 'string', description: 'Location (e.g., "San Francisco, CA")' },
        radius: { type: 'number', default: 5000 },
        max_results: { type: 'number', default: 20 },
      },
      required: ['keyword', 'location'],
    },
  },
  {
    name: 'find_leads',
    description: 'Find B2B leads with emails using AI enrichment (code_crafter/leads-finder). Costs $0.12 per 100 leads. Much cheaper than Apollo!',
    inputSchema: {
      type: 'object',
      properties: {
        job_title: { type: 'string', description: 'Job titles (e.g., "CEO, CTO, Founder")' },
        location: { type: 'string', description: 'Location (e.g., "United States", "San Francisco")' },
        industry: { type: 'string', description: 'Industry (e.g., "Software", "Healthcare")' },
        company_size: { type: 'string', description: 'Company size (e.g., "11-50", "51-200")' },
        keywords: { type: 'string', description: 'Keywords to filter leads' },
        company_website: { type: 'string', description: 'Specific company domain to target (optional)' },
        num_leads: { type: 'number', description: 'Number of leads (max 1000 per call)', default: 100 },
        email_status: { type: 'string', enum: ['verified', 'unverified', 'all'], default: 'verified' },
      },
      required: ['job_title'],
    },
  },
  {
    name: 'find_emails',
    description: 'Find email addresses for a company domain using Hunter.io. Costs $0.08 per call.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Company domain (e.g., "stripe.com")' },
        limit: { type: 'number', description: 'Max emails', default: 10 },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_company_info',
    description: 'Get company data from website scraping + email patterns. Costs $0.05 per call.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Company domain (e.g., "stripe.com")' },
        find_emails: { type: 'boolean', description: 'Find emails via Hunter.io', default: true },
      },
      required: ['domain'],
    },
  },
  {
    name: 'call_actor',
    description: 'Run any Apify actor by ID. Cost varies.',
    inputSchema: {
      type: 'object',
      properties: {
        actor_id: { type: 'string', description: 'Actor ID (e.g., "apify/linkedin-profile-scraper")' },
        input: { type: 'object', description: 'Actor input parameters' },
        timeout_secs: { type: 'number', default: 120 },
      },
      required: ['actor_id', 'input'],
    },
  },
];

const server = new Server(
  { name: 'web-intelligence-mcp', version: '1.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.log(`Tool called: ${name}`, args);

  try {
    switch (name) {
      case 'search_web':
        return await handleSearchWeb(args as any);
      case 'scrape_page':
        return await handleScrapePage(args as any);
      case 'find_local_leads':
        return await handleFindLocalLeads(args as any);
      case 'find_leads':
        return await handleFindLeads(args as any);
      case 'find_emails':
        return await handleFindEmails(args as any);
      case 'get_company_info':
        return await handleGetCompanyInfo(args as any);
      case 'call_actor':
        return await handleCallActor(args as any);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in ${name}:`, error);
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

// Tool: Search Web
async function handleSearchWeb({ query, num_results = 10 }: { query: string; num_results?: number }) {
  await Actor.charge({ eventName: 'search-web' });
  
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error('SERPAPI_KEY not configured');

  const response = await axios.get('https://serpapi.com/search', {
    params: { q: query, api_key: key, engine: 'google', num: Math.min(num_results, 20) },
    timeout: 30000,
  });

  const results = response.data.organic_results?.map((r: any) => ({
    title: r.title, link: r.link, snippet: r.snippet
  })) || [];

  return { content: [{ type: 'text', text: JSON.stringify({ query, results }, null, 2) }] };
}

// Tool: Scrape Page
async function handleScrapePage({ url }: { url: string }) {
  await Actor.charge({ eventName: 'scrape-page' });
  
  const jinaKey = process.env.JINA_AI_KEY;
  let content: string;
  let title: string;

  if (jinaKey) {
    const res = await axios.get(`https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`, {
      headers: { Authorization: `Bearer ${jinaKey}` },
      timeout: 30000,
    });
    content = res.data;
    title = content.split('\n')[0] || url;
  } else {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    });
    const $ = cheerio.load(res.data);
    title = $('title').text() || url;
    $('script, style, nav, footer').remove();
    content = ($('main, article, .content').first().text() || $('body').text()).replace(/\s+/g, ' ').trim();
  }

  return { content: [{ type: 'text', text: JSON.stringify({ url, title, content }, null, 2) }] };
}

// Tool: Find Local Leads (Google Maps)
async function handleFindLocalLeads({ keyword, location, radius = 5000, max_results = 20 }: any) {
  await Actor.charge({ eventName: 'find-local-leads' });
  
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY not configured');

  const geo = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { address: location, key },
  });
  
  if (geo.data.status !== 'OK') throw new Error(`Geocoding failed: ${geo.data.status}`);
  const { lat, lng } = geo.data.results[0].geometry.location;

  const places = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
    params: { location: `${lat},${lng}`, radius, keyword, key },
  });

  if (places.data.status !== 'OK') throw new Error(`Places search failed: ${places.data.status}`);

  const leads = await Promise.all(
    places.data.results.slice(0, max_results).map(async (place: any) => {
      try {
        const details = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
          params: { place_id: place.place_id, fields: 'name,formatted_address,formatted_phone_number,website,rating', key },
        });
        const d = details.data.result;
        return {
          name: d.name, address: d.formatted_address, phone: d.formatted_phone_number,
          website: d.website, rating: d.rating,
          maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        };
      } catch (e) {
        return { name: place.name, rating: place.rating };
      }
    })
  );

  return { content: [{ type: 'text', text: JSON.stringify({ keyword, location, leads }, null, 2) }] };
}

// Tool: Find Leads (using code_crafter/leads-finder - the Apollo alternative)
async function handleFindLeads({ 
  job_title, 
  location, 
  industry, 
  company_size, 
  keywords, 
  company_website,
  num_leads = 100,
  email_status = 'verified'
}: any) {
  await Actor.charge({ eventName: 'find-leads' });
  
  console.log(`Running leads-finder for: ${job_title} in ${location}`);
  
  // Map to the actor's input format
  const actorInput = {
    leadsCount: Math.min(num_leads, 1000), // Max 1000 per run
    fileName: `leads_${Date.now()}`,
    jobTitle: job_title,
    locationInclude: location || '',
    locationExclude: '',
    emailStatus: email_status,
    companyWebsite: company_website || '',
    size: company_size || '',
    industry: industry || '',
    keywords: keywords || '',
    revenue: '',
    funding: ''
  };

  // Call the actor
  const run = await Actor.start('code_crafter/leads-finder', actorInput);
  console.log(`Leads finder run started: ${run.id}`);
  
  // Wait for completion (max 5 minutes)
  const timeout = 5 * 60 * 1000;
  const startTime = Date.now();
  
  while (true) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for leads-finder (run ID: ${run.id})`);
    }
    
    const runInfo = await Actor.apifyClient.run(run.id).get();
    
    if (runInfo.status === 'SUCCEEDED') {
      // Get results from dataset
      const { items } = await Actor.apifyClient.dataset(runInfo.defaultDatasetId).listItems();
      
      // Format the leads nicely
      const formattedLeads = items.map((lead: any) => ({
        name: lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        title: lead.title || lead.jobTitle,
        company: lead.company || lead.organization,
        email: lead.email,
        email_status: lead.emailStatus || lead.email_verified,
        linkedin: lead.linkedin || lead.linkedinUrl,
        location: lead.location,
        industry: lead.industry,
        company_size: lead.companySize || lead.size,
        website: lead.website || lead.companyWebsite,
        phone: lead.phone,
      }));
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: { job_title, location, industry },
            leads_found: formattedLeads.length,
            cost_estimate: `$${(formattedLeads.length * 0.0015).toFixed(2)}`, // $1.5 per 1000
            leads: formattedLeads,
            actor_run_id: run.id
          }, null, 2),
        }],
      };
    }
    
    if (['FAILED', 'TIMED_OUT', 'ABORTED'].includes(runInfo.status)) {
      throw new Error(`Leads finder ${runInfo.status}: ${runInfo.statusMessage || 'Unknown error'}`);
    }
    
    await new Promise(r => setTimeout(r, 3000)); // Poll every 3 seconds
  }
}

// Tool: Find Emails (Hunter.io)
async function handleFindEmails({ domain, limit = 10 }: { domain: string; limit?: number }) {
  await Actor.charge({ eventName: 'find-emails' });
  
  const key = process.env.HUNTER_API_KEY;
  if (!key) throw new Error('HUNTER_API_KEY not configured');

  const response = await axios.get('https://api.hunter.io/v2/domain-search', {
    params: { domain, limit, api_key: key },
    timeout: 15000,
  });

  const data = response.data.data;
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        domain,
        organization: data.organization,
        pattern: data.pattern,
        emails: data.emails.map((e: any) => ({
          email: e.value,
          confidence: e.confidence,
          first_name: e.first_name,
          last_name: e.last_name,
          position: e.position,
        })),
      }, null, 2),
    }],
  };
}

// Tool: Get Company Info (Scraping + Hunter)
async function handleGetCompanyInfo({ domain, find_emails = true }: any) {
  await Actor.charge({ eventName: 'company-info' });
  
  const result: any = { domain, sources: [] };

  // Website scraping
  try {
    const res = await axios.get(`https://${domain}`, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(res.data);
    result.website = {
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      tech: res.headers.server ? [res.headers.server] : [],
    };
    result.sources.push('website');
  } catch (e) {
    result.website_error = 'Could not scrape';
  }

  // Hunter.io emails
  if (find_emails && process.env.HUNTER_API_KEY) {
    try {
      const res = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: { domain, limit: 5, api_key: process.env.HUNTER_API_KEY },
      });
      result.email_pattern = res.data.data.pattern;
      result.emails = res.data.data.emails.map((e: any) => ({
        email: e.value,
        confidence: e.confidence,
        name: `${e.first_name} ${e.last_name}`.trim(),
      }));
      result.sources.push('hunter');
    } catch (e) {
      console.error('Hunter error:', e);
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// Tool: Generic Actor Caller
async function handleCallActor({ actor_id, input, timeout_secs = 120 }: any) {
  await Actor.charge({ eventName: 'call-actor' });
  
  console.log(`Calling actor ${actor_id}...`);
  
  const run = await Actor.start(actor_id, input);
  const timeout = timeout_secs * 1000;
  const startTime = Date.now();
  
  while (true) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout: ${run.id}`);
    }
    
    const runInfo = await Actor.apifyClient.run(run.id).get();
    
    if (runInfo.status === 'SUCCEEDED') {
      const { items } = await Actor.apifyClient.dataset(runInfo.defaultDatasetId).listItems();
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({ actor_id, status: 'SUCCEEDED', results: items }, null, 2) 
        }],
      };
    }
    
    if (['FAILED', 'TIMED_OUT', 'ABORTED'].includes(runInfo.status)) {
      throw new Error(`Actor ${runInfo.status}: ${runInfo.statusMessage || 'Unknown'}`);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Start server
const transportType = process.env.MCP_TRANSPORT || 'sse';

if (transportType === 'stdio') {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('MCP server running on stdio');
} else {
  const port = process.env.APIFY_WEB_SERVER_PORT || 3000;
  
  import('http').then((http) => {
    const httpServer = http.createServer(async (req, res) => {
      if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      
      if (req.url === '/sse') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        
        const transport = new SSEServerTransport('/sse', res);
        server.connect(transport);
        
        req.on('close', () => console.log('Client disconnected'));
        return;
      }
      
      res.writeHead(404);
      res.end('Not found');
    });
    
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`SSE: http://localhost:${port}/sse`);
    });
  });
}
