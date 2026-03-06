// Tool: Find Emails (Hunter.io) - COMPLETED
async function handleFindEmails({ domain, limit = 10 }: { domain: string; limit?: number }) {
  await Actor.charge({ eventName: 'find-emails' });
  
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
        emails: emails,
      }, null, 2),
    }],
  };
}

// Tool: Get Company Info
async function handleGetCompanyInfo({ domain, find_emails = true }: { domain: string; find_emails?: boolean }) {
  await Actor.charge({ eventName: 'get-company-info' });
  
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  
  let websiteData: any = {};
  try {
    const url = `https://${cleanDomain}`;
    const res = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
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
        timestamp: new Date().toISOString(),
      }, null, 2),
    }],
  };
}

// Tool: Call Any Actor
async function handleCallActor({ 
  actor_id, 
  input, 
  timeout_secs = 120 
}: { 
  actor_id: string; 
  input: any; 
  timeout_secs?: number;
}) {
  await Actor.charge({ eventName: 'call-actor', count: 1 });
  
  console.log(`Calling actor ${actor_id} with input:`, JSON.stringify(input, null, 2));
  
  const run = await Actor.start(actor_id, input);
  console.log(`Actor run started: ${run.id}`);
  
  const timeout = timeout_secs * 1000;
  const startTime = Date.now();

  // FIX: exponential backoff instead of fixed 2s polling
  let pollInterval = 2000;
  const maxPollInterval = 15000;
  
  while (true) {
    if (Date.now() - startTime > timeout) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'TIMEOUT',
            message: `Actor run exceeded ${timeout_secs}s timeout`,
            actor_id,
            run_id: run.id,
            monitor_url: `https://console.apify.com/actors/runs/${run.id}`,
            input,
          }, null, 2),
        }],
      };
    }
    
    const runInfo = await Actor.apifyClient.run(run.id).get();
    
    if (!runInfo) {
      throw new Error('Failed to retrieve run information');
    }
    
    if (runInfo.status === 'SUCCEEDED') {
      const datasetItems: any[] = [];
      try {
        const datasetClient = Actor.apifyClient.dataset(runInfo.defaultDatasetId);
        let offset = 0;
        const limit = 1000;
        
        while (true) {
          // FIX: use 'count' instead of 'total' — listItems returns { items, count, total, offset, limit }
          const result = await datasetClient.listItems({ offset, limit });
          const items = result.items ?? [];
          datasetItems.push(...items);
          offset += items.length;
          if (items.length === 0 || items.length < limit) break;
        }
      } catch (e) {
        console.warn('Could not fetch dataset items:', e);
      }
      
      let output: any = null;
      try {
        const kvStore = Actor.apifyClient.keyValueStore(runInfo.defaultKeyValueStoreId);
        output = await kvStore.getRecord('OUTPUT');
      } catch (e) {
        // No output record
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'SUCCEEDED',
            actor_id,
            run_id: run.id,
            run_url: `https://console.apify.com/actors/runs/${run.id}`,
            duration: runInfo.stats?.durationSecs,
            cost_usd: runInfo.stats?.costUsd,
            dataset_items_count: datasetItems.length,
            dataset_sample: datasetItems.slice(0, 10),
            output: output?.value || null,
          }, null, 2),
        }],
      };
    }
    
    if (['FAILED', 'ABORTED'].includes(runInfo.status)) {
      throw new Error(`Actor run ${runInfo.status}: ${runInfo.statusMessage || 'Unknown error'}`);
    }
    
    await new Promise(r => setTimeout(r, pollInterval));
    pollInterval = Math.min(pollInterval * 1.5, maxPollInterval); // backoff
  }
}

// Server Transport Setup
async function main() {
  const transportType = process.env.MCP_TRANSPORT || 'stdio';
  
  if (transportType === 'sse') {
    const port = parseInt(process.env.PORT || '3000');
    const http = await import('http');
    const express = await import('express');
    
    const app = express.default();

    // FIX: track active SSE transports per client so POST /messages routes correctly
    const activeTransports = new Map<string, SSEServerTransport>();

    app.get('/sse', async (req, res) => {
      const transport = new SSEServerTransport('/messages', res);

      // Each SSE transport has a sessionId assigned by the MCP SDK
      const sessionId = transport.sessionId;
      activeTransports.set(sessionId, transport);

      res.on('close', () => {
        activeTransports.delete(sessionId);
        console.log(`Client disconnected: ${sessionId}`);
      });

      await mcpServer.connect(transport); // FIX: use mcpServer, not httpServer
      console.log(`Client connected: ${sessionId}`);
    });

    app.post('/messages', express.default.json(), async (req, res) => {
      // FIX: route incoming message to the correct client's transport
      const sessionId = req.query.sessionId as string;

      if (!sessionId || !activeTransports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing sessionId' });
        return;
      }

      const transport = activeTransports.get(sessionId)!;
      await transport.handlePostMessage(req, res);
    });

    // FIX: renamed to httpServer to avoid collision with mcpServer
    const httpServer = http.createServer(app);
    httpServer.listen(port, () => {
      console.log(`MCP Server running on port ${port} (SSE mode)`);
    });
  } else {
    // Stdio Transport (default)
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('MCP Server running on stdio');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mcpServer.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mcpServer.close();
  process.exit(0);
});

main().catch(console.error);
