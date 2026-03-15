import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import 'dotenv/config';

async function test() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is missing");

  // Since we know SSE handshake reaches the server, we'll try a tool call
  // We need a RUNNING run to hit the .runs.apify.net URL
  // Or we can hit the .apify.actor URL if it's currently active
  
  console.log("Starting a fresh Actor run for Kaspr test...");
  // I'll use the API to start a run and get its URL
  const startRes = await fetch(`https://api.apify.com/v2/acts/ernesta-labs~forage/runs?token=${token}`, { method: 'POST' });
  const runData = (await startRes.json() as any).data;
  const runId = runData.id;
  console.log("Run ID:", runId);

  // Wait for it to pull and start
  console.log("Waiting for container to start...");
  await new Promise(r => setTimeout(r, 30000));

  // Get the URL from the run detail
  const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
  const runDetail = (await runRes.json() as any).data;
  const baseUrl = runDetail.containerUrl; 
  console.log("Container URL:", baseUrl);

  if (!baseUrl) {
     console.error("No container URL found. Is it in Standby mode?");
     process.exit(1);
  }

  const transport = new SSEClientTransport(new URL(`${baseUrl}/sse?token=${token}`));
  const client = new Client({ name: "kaspr-test-client", version: "1.0.0" }, { capabilities: {} });
  
  try {
    console.log("Connecting to", baseUrl);
    await client.connect(transport);
    
    console.log("Connected! Calling skill_kaspr_enrich...");
    const result = await client.callTool({
      name: "skill_kaspr_enrich",
      arguments: {
        linkedin_id: "william-gate-5b12345", // Dummy
        prospect_name: "Bill Gates"
      }
    });
    
    console.log("Kaspr Result:");
    console.dir(result, { depth: null });

    await client.close();
  } catch (err) {
    console.error("Kaspr test failed:");
    console.error(err);
  }
}

test().catch(console.error);
