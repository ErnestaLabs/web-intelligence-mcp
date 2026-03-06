#!/usr/bin/env node
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

await Actor.init();

// ==========================================
// ERNESTA LABS BIBLE SECTION 5: PRICING CONFIG
// Actor.charge() values are PRE-CALCULATED to include margin after Apify's ~25% cut
// ==========================================

type ActorTier = 'native' | 'verified' | 'open';

interface ActorPricing {
  tier: ActorTier;
  actorChargeValue: number; // The exact value passed to Actor.charge()
  unitName: string;
  description: string;
  requiresCount?: boolean; // If true, multiply charge by count/units
}

// TIER 1: NATIVE TOOLS (Section 5 pricing)
const PRICING = {
  // Native Core
  SEARCH_WEB: { event: 'search-web', value: 0.03, unit: 'per_call' },
  SCRAPE_PAGE: { event: 'scrape-page', value: 0.07, unit: 'per_call' },
  GET_COMPANY_INFO: { event: 'get-company-info', value: 0.08, unit: 'per_call' },
  FIND_EMAILS: { event: 'find-emails', value: 0.10, unit: 'per_call' },
  FIND_LOCAL_LEADS: { event: 'find-local-leads', value: 0.15, unit: 'per_call' },
  FIND_LEADS: { event: 'find-leads', value: 0.25, unit: 'per_100_leads' }, // Section 5: $0.25 per 100
  
  // Discovery
  LIST_ACTORS: { event: 'list-verified', value: 0.01, unit: 'per_call' },
  GET_SCHEMA: { event: 'get-schema', value: 0.01, unit: 'per_call' },
  
  // Open Access markup
  OPEN_ACCESS_MARKUP_PERCENT: 25,
  OPEN_ACCESS_MINIMUM_FEE: 0.01
};

// TIER 2: VERIFIED PARTNERS (Section 5 & 6 context)
const VERIFIED_ACTORS = new Map<string, ActorPricing>([
  ['apify/website-content-crawler', { 
    tier: 'verified', 
    actorChargeValue: 0.20, // $0.20 per 1000 pages as per Bible context
    unitName: 'per_1000_pages',
    description: 'Deep website crawling'
  }],
  ['apify/google-maps-scraper', { 
    tier: 'verified', 
    actorChargeValue: 0.27, // $0.27 per 1000 places
    unitName: 'per_1000_places',
    description: 'Google Maps reviews and details'
  }],
  ['clockworks/free-twitter-scraper', { 
    tier: 'verified', 
    actorChargeValue: 0.05, // $0.05 per 1000 tweets (base is free, we charge for overhead)
    unitName: 'per_1000_tweets',
    description: 'Twitter/X data extraction'
  }],
  ['drobnikj/pdf-to-text', { 
    tier: 'verified', 
    actorChargeValue: 0.14, // $0.14 per 100 pages
    unitName: 'per_100_pages',
    description: 'PDF parsing'
  }],
  ['apify/linkedin-profile-scraper', { 
    tier: 'verified', 
    actorChargeValue: 0.67, // $0.67 per 100 profiles
    unitName: 'per_100_profiles',
    description: 'LinkedIn profile data'
  }],
  ['apify/instagram-scraper', { 
    tier: 'verified', 
    actorChargeValue: 0.20, // $0.20 per 1000 posts
    unitName: 'per_1000_posts',
    description: 'Instagram posts and profiles'
  }]
]);

const TOOLS: Tool[] = [
  // === TIER 1: NATIVE CURATED TOOLS (Section 5 Pricing) ===
  {
    name: 'search_web',
    description: 'Google Search. Cost: $0.03/call',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        num_results: { type: 'number', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'scrape_page',
    description: 'Scrape any webpage. Cost: $0.07/call',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_company_info',
    description: 'Company intelligence. Cost: $0.08/call',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string' },
        find_emails: { type: 'boolean', default: true },
      },
      required: ['domain'],
    },
  },
  {
    name: 'find_emails',
    description: 'Email discovery. Cost: $0.10/call',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
      required: ['domain'],
    },
  },
  {
    name: 'find_local_leads',
    description: 'Google Maps leads. Cost: $0.15/call',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string' },
        location: { type: 'string' },
        radius: { type: 'number', default: 5000 },
        max_results: { type: 'number', default: 20 },
      },
      required: ['keyword', 'location'],
    },
  },
  {
    name: 'find_leads',
    description: 'B2B leads with emails. Cost: $0.25 per 100 leads',
    inputSchema: {
      type: 'object',
      properties: {
        job_title: { type: 'string', description: 'e.g., "CEO, CTO, Founder"' },
        location: { type: 'string', description: 'e.g., "San Francisco, CA"' },
        industry: { type: 'string' },
        company_size: { type: 'string' },
        keywords: { type: 'string' },
        company_website: { type: 'string' },
        num_leads: { type: 'number', default: 100 },
        email_status: { type: 'string', enum: ['verified', 'unverified', 'all'], default: 'verified' },
      },
      required: ['job_title'],
    },
  },
  
  // === UNIVERSAL GATEWAY (Tier 2 Verified + Tier 3 Open) ===
  {
    name: 'list_verified_actors',
    description: 'Browse curated verified actors with transparent pricing. Cost: $0.01/call',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['all', 'social', 'leads', 'scraping', 'documents'], default: 'all' },
      },
    },
  },
  {
    name: 'get_actor_schema',
    description: 'Get actor input schema and pricing. Cost: $0.01/call',
    inputSchema: {
      type: 'object',
      properties: {
        actor_id: { type: 'string', description: 'e.g., "apify/website-content-crawler"' },
      },
      required: ['actor_id'],
    },
  },
  {
    name: 'call_actor',
    description: 'Run any Apify actor (Verified partners + Open marketplace). Cost varies by actor + 25% platform fee.',
    inputSchema: {
      type: 'object',
      properties: {
        actor_id: { type: 'string' },
        input: { type: 'object' },
        timeout_secs: { type: 'number', default: 120 },
        max_cost_usd: { type: 'number', description: 'Abort if estimated cost exceeds this' },
      },
      required: ['actor_id', 'input'],
    },
  },
];

const mcpServer = new Server(
  { name: 'forage-mcp', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.log(`[Forage] Tool called: ${name}`, args);

  try {
    switch (name) {
      case 'search_web':
        return await handleSearchWeb(args as any);
      case 'scrape_page':
        return await handleScrapePage(args as any);
      case 'get_company_info':
        return await handleGetCompanyInfo(args as any);
      case 'find_emails':
        return await handleFindEmails(args as any);
      case 'find_local_leads':
        return await handleFindLocalLeads(args as any);
      case 'find_leads':
        return await handleFindLeads(args as any);
      case 'list_verified_actors':
        return await handleListVerifiedActors(args as any);
      case 'get_actor_schema':
        return await handleGetActorSchema(args as any);
      case 'call_actor':
        return await handleCallActor(args as any);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`[Forage] Error in ${name}:`, error);
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

// ==========================================
// HANDLERS (Bible Section 7 Fixes Applied)
// ==========================================

async function handleSearchWeb({ query, num_results = 10 }: { query: string; num_results?: number }) {
  // Section 5 Pricing: $0.03 per call
  await Actor.charge({ eventName: PRICING.SEARCH_WEB.event, count: 1 });
  
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error('SERPAPI_KEY not configured');

  const response = await axios.get('https://serpapi.com/search', {
    params: { q: query, api_key: key, engine: 'google', num: Math.min(num_results, 20) },
    timeout: 30000,
  });

  const results = response.data.organic_results?.map((r: any) => ({
    title: r.title, link: r.link, snippet: r.snippet
  })) || [];

  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify({ query, results, cost_usd: PRICING.SEARCH_WEB.value }, null, 2) 
    }] 
  };
}

async function handleScrapePage({ url }: { url: string }) {
  // Section 5 Pricing: $0.07 per call
  await Actor.charge({ eventName: PRICING.SCRAPE_PAGE.event, count: 1 });
  
  const jinaKey = process.env.JINA_AI_KEY;
  let content: string;
  let title: string;

  if (jinaKey) {
    // BIBLE SECTION 7 FIX 1: Use https:// protocol for Jina AI
    const cleanUrl = url.replace(/^https?:\/\//, '');
    const res = await axios.get(`https://r.jina.ai/https://${cleanUrl}`, {
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

  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify({ url, title, content, cost_usd: PRICING.SCRAPE_PAGE.value }, null, 2) 
    }] 
  };
}

async function handleGetCompanyInfo({ domain, find_emails = true }: { domain: string; find_emails?: boolean }) {
  // Section 5 Pricing: $0.08 per call
  await Actor.charge({ eventName: PRICING.GET_COMPANY_INFO.event, count: 1 });
  
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  
  let websiteData: any = {};
  try {
    const url = `https://${cleanDomain}`;
    const res = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
      maxRedirects: 5,
    });
    
    const $ = cheerio.load(res.data);
    websiteData = {
      title: $('title').text()?.trim() || null,
      description: $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content') || null,
      social_links: {
        linkedin: $('a[href*="linkedin.com"]').first().attr('href') || null,
        twitter: $('a[href*="twitter.com"], a[href*="x.com"]').first().attr('href') || null,
        facebook: $('a[href*="facebook.com"]').first().attr('href') || null,
      },
      contact_page: $('a[href*="contact"], a[href*="about"]').first().attr('href') || null,
    };
  } catch (error) {
    websiteData = { error: 'Failed to scrape website', details: (error as Error).message };
  }

  let emailData: any = {};
  if (find_emails && process.env.HUNTER_API_KEY) {
    try {
      const hunterRes = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: { domain: cleanDomain, api_key: process.env.HUNTER_API_KEY },
        timeout: 15000,
      });
      emailData = {
        pattern: hunterRes.data.data?.pattern || null,
        organization: hunterRes.data.data?.organization || null,
        sample_emails: hunterRes.data.data?.emails?.slice(0, 3).map((e: any) => ({
          email: e.value,
          position: e.position,
        })) || [],
      };
    } catch (error) {
      emailData = { error: 'Failed to fetch email data' };
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        domain: cleanDomain,
        website: websiteData,
        email_intelligence: emailData,
        cost_usd: PRICING.GET_COMPANY_INFO.value,
        timestamp: new Date().toISOString(),
      }, null, 2),
    }],
  };
}

async function handleFindEmails({ domain, limit = 10 }: { domain: string; limit?: number }) {
  // Section 5 Pricing: $0.10 per call
  await Actor.charge({ eventName: PRICING.FIND_EMAILS.event, count: 1 });
  
  const key = process.env.HUNTER_API_KEY;
  if (!key) throw new Error('HUNTER_API_KEY not configured');

  const response = await axios.get('https://api.hunter.io/v2/domain-search', {
    params: { domain, limit, api_key: key },
    timeout: 30000,
  });

  const data = response.data.data;
  const emails = data.emails?.map((e: any) => ({
    email: e.value,
    type: e.type,
    confidence: e.confidence,
    first_name: e.first_name,
    last_name: e.last_name,
    position: e.position,
    seniority: e.seniority,
    department: e.department,
    linkedin: e.linkedin,
    twitter: e.twitter,
    phone_number: e.phone_number,
  })) || [];

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        domain,
        organization: data.organization,
        emails_found: emails.length,
        pattern: data.pattern,
        emails,
        cost_usd: PRICING.FIND_EMAILS.value,
      }, null, 2),
    }],
  };
}

async function handleFindLocalLeads({ keyword, location, radius = 5000, max_results = 20 }: any) {
  // Section 5 Pricing: $0.15 per call
  await Actor.charge({ eventName: PRICING.FIND_LOCAL_LEADS.event, count: 1 });
  
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
          name: d.name, 
          address: d.formatted_address, 
          phone: d.formatted_phone_number,
          website: d.website, 
          rating: d.rating,
          maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        };
      } catch (e) {
        return { name: place.name, rating: place.rating };
      }
    })
  );

  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify({ keyword, location, leads, cost_usd: PRICING.FIND_LOCAL_LEADS.value }, null, 2) 
    }] 
  };
}

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
  // Section 5 Pricing: $0.25 per 100 leads
  const chargeUnits = Math.ceil(num_leads / 100);
  await Actor.charge({ eventName: PRICING.FIND_LEADS.event, count: chargeUnits });
  
  const actorInput = {
    leadsCount: Math.min(num_leads, 1000),
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

  const run = await Actor.start('code_crafter/leads-finder', actorInput);
  console.log(`[Forage] Leads finder run started: ${run.id}`);
  
  const timeout = 5 * 60 * 1000;
  const startTime = Date.now();
  let pollInterval = 2000;
  const maxPollInterval = 15000;
  
  while (true) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for leads-finder (run ID: ${run.id})`);
    }
    
    const runInfo = await Actor.apifyClient.run(run.id).get();
    if (!runInfo) throw new Error('Failed to get run info');
    
    if (runInfo.status === 'SUCCEEDED') {
      // BIBLE SECTION 7 FIX 2: Paginate through all dataset items (handles >250 leads)
      const allItems: any[] = [];
      let offset = 0;
      const pageLimit = 250;
      
      while (true) {
        const result = await Actor.apifyClient.dataset(runInfo.defaultDatasetId).listItems({ 
          offset, 
          limit: pageLimit 
        });
        const items = result.items ?? [];
        allItems.push(...items);
        offset += items.length;
        if (items.length === 0 || items.length < pageLimit) break;
      }
      
      const formattedLeads = allItems.map((lead: any) => ({
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
            cost_usd: PRICING.FIND_LEADS.value * chargeUnits,
            leads: formattedLeads,
            actor_run_id: run.id
          }, null, 2),
        }],
      };
    }
    
    if (['FAILED', 'TIMED_OUT', 'ABORTED'].includes(runInfo.status)) {
      throw new Error(`Leads finder ${runInfo.status}: ${runInfo.statusMessage || 'Unknown error'}`);
    }
    
    await new Promise(r => setTimeout(r, pollInterval));
    pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
  }
}

// ==========================================
// UNIVERSAL GATEWAY HANDLERS
// ==========================================

async function handleListVerifiedActors({ category = 'all' }: { category?: string }) {
  await Actor.charge({ eventName: PRICING.LIST_ACTORS.event, count: 1 });
  
  const verified = Array.from(VERIFIED_ACTORS.entries())
    .map(([actorId, pricing]) => ({
      actor_id: actorId,
      name: actorId.split('/').pop(),
      description: pricing.description,
      cost_usd: pricing.actorChargeValue,
      unit: pricing.unitName,
      tier: pricing.tier
    }));
  
  if (category !== 'all') {
    // Simple keyword filter based on description
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          category,
          actors: verified.filter(a => a.description.toLowerCase().includes(category)),
          cost_usd: PRICING.LIST_ACTORS.value
        }, null, 2)
      }]
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        tier: 'verified_partners',
        count: verified.length,
        actors: verified,
        open_access_note: 'Use call_actor for any actor not listed here (25% markup)',
        cost_usd: PRICING.LIST_ACTORS.value
      }, null, 2)
    }]
  };
}

async function handleGetActorSchema({ actor_id }: { actor_id: string }) {
  await Actor.charge({ eventName: PRICING.GET_SCHEMA.event, count: 1 });
  
  try {
    const response = await axios.get(`https://api.apify.com/v2/acts/${actor_id}`, {
      headers: process.env.APIFY_TOKEN ? { Authorization: `Bearer ${process.env.APIFY_TOKEN}` } : {}
    });
    
    const actor = response.data.data;
    if (!actor) throw new Error(`Actor ${actor_id} not found`);

    const inputSchema = actor.input?.schema || actor.inputSchema;
    const pricing = VERIFIED_ACTORS.get(actor_id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          actor_id,
          name: actor.name,
          description: actor.description,
          is_verified: !!pricing,
          cost_estimate: pricing ? {
            usd: pricing.actorChargeValue,
            unit: pricing.unitName
          } : 'Dynamic (25% markup on actor cost)',
          input_schema: inputSchema || { warning: 'No schema defined', example: actor.exampleRunInput },
          example_input: actor.exampleRunInput,
          cost_usd: PRICING.GET_SCHEMA.value
        }, null, 2),
      }],
    };
  } catch (error) {
    throw new Error(`Failed to get schema for ${actor_id}: ${(error as Error).message}`);
  }
}

async function handleCallActor({ 
  actor_id, 
  input, 
  timeout_secs = 120,
  max_cost_usd
}: { 
  actor_id: string; 
  input: any; 
  timeout_secs?: number;
  max_cost_usd?: number;
}) {
  // Determine pricing tier
  const verifiedPricing = VERIFIED_ACTORS.get(actor_id);
  let estimatedCost: number;
  let pricingTier: string;
  
  if (verifiedPricing) {
    estimatedCost = verifiedPricing.actorChargeValue;
    pricingTier = 'verified';
  } else {
    // Tier 3: Calculate dynamic pricing with 25% markup
    try {
      const response = await axios.get(`https://api.apify.com/v2/acts/${actor_id}`, {
        headers: process.env.APIFY_TOKEN ? { Authorization: `Bearer ${process.env.APIFY_TOKEN}` } : {}
      });
      const basePrice = response.data.data?.pricingInfos?.[0]?.pricePerUnit || 0;
      const markup = Math.max(basePrice * (PRICING.OPEN_ACCESS_MARKUP_PERCENT / 100), PRICING.OPEN_ACCESS_MINIMUM_FEE);
      estimatedCost = basePrice + markup;
      pricingTier = 'open';
    } catch (e) {
      estimatedCost = PRICING.OPEN_ACCESS_MINIMUM_FEE;
      pricingTier = 'open_unknown';
    }
  }
  
  // Cost safety check
  if (max_cost_usd !== undefined && estimatedCost > max_cost_usd) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: 'COST_EXCEEDED',
          actor_id,
          requested_max: max_cost_usd,
          estimated_cost: estimatedCost,
          tier: pricingTier,
          message: `Estimated cost ($${estimatedCost}) exceeds max_cost_usd ($${max_cost_usd})`
        }, null, 2)
      }],
      isError: true
    };
  }
  
  // Execute
  await Actor.charge({ eventName: `actor-call-${pricingTier}`, count: 1 });
  
  console.log(`[Forage] Calling actor ${actor_id} [${pricingTier}]`);
  const run = await Actor.start(actor_id, input);
  
  const timeout = timeout_secs * 1000;
  const startTime = Date.now();
  let pollInterval = 2000;
  const maxPollInterval = 15000;
  
  while (true) {
    if (Date.now() - startTime > timeout) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'TIMEOUT',
            actor_id,
            run_id: run.id,
            monitor_url: `https://console.apify.com/actors/runs/${run.id}`,
          }, null, 2),
        }],
      };
    }
    
    const runInfo = await Actor.apifyClient.run(run.id).get();
    if (!runInfo) throw new Error('Failed to retrieve run information');
    
    if (runInfo.status === 'SUCCEEDED') {
      const datasetItems: any[] = [];
      try {
        const datasetClient = Actor.apifyClient.dataset(runInfo.defaultDatasetId);
        let offset = 0;
        const limit = 1000;
        
        while (true) {
          const result = await datasetClient.listItems({ offset, limit });
          const items = result.items ?? [];
          datasetItems.push(...items);
          offset += items.length;
          if (items.length === 0 || items.length < limit) break;
        }
      } catch (e) {
        console.warn('Could not fetch dataset items:', e);
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'SUCCEEDED',
            actor_id,
            run_id: run.id,
            tier: pricingTier,
            estimated_cost_usd: estimatedCost,
            dataset_items_count: datasetItems.length,
            dataset_sample: datasetItems.slice(0, 10),
          }, null, 2),
        }],
      };
    }
    
    if (['FAILED', 'ABORTED'].includes(runInfo.status)) {
      throw new Error(`Actor run ${runInfo.status}: ${runInfo.statusMessage || 'Unknown error'}`);
    }
    
    await new Promise(r => setTimeout(r, pollInterval));
    pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
  }
}

// ==========================================
// SERVER SETUP
// ==========================================

async function main() {
  const transportType = process.env.MCP_TRANSPORT || 'stdio';
  
  if (transportType === 'sse') {
    const port = parseInt(process.env.PORT || '3000');
    const http = await import('http');
    const express = await import('express');
    
    const app = express.default();
    const activeTransports = new Map<string, SSEServerTransport>();

    app.get('/sse', async (req, res) => {
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      activeTransports.set(sessionId, transport);

      res.on('close', () => {
        activeTransports.delete(sessionId);
        console.log(`[Forage] Client disconnected: ${sessionId}`);
      });

      await mcpServer.connect(transport);
      console.log(`[Forage] Client connected: ${sessionId}`);
    });

    app.post('/messages', express.default.json(), async (req, res) => {
      const sessionId = req.query.sessionId as string;
      if (!sessionId || !activeTransports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing sessionId' });
        return;
      }
      const transport = activeTransports.get(sessionId)!;
      await transport.handlePostMessage(req, res);
    });

    const httpServer = http.createServer(app);
    httpServer.listen(port, () => {
      console.log(`[Forage] Platform Gateway running on port ${port} (SSE mode)`);
    });
  } else {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('[Forage] Platform Gateway running on stdio');
  }
}

process.on('SIGINT', async () => {
  await mcpServer.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mcpServer.close();
  process.exit(0);
});

main().catch(console.error);
