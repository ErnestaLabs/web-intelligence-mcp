import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import 'dotenv/config';

async function proveIt() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is missing");

  console.log("🚀 Starting a fresh Actor run for Forage MCP...");
  const startRes = await fetch(`https://api.apify.com/v2/acts/ernesta_labs~forage/runs?token=${token}`, { method: 'POST' });
  const startJson = await startRes.json() as any;
  
  if (!startJson.data) {
      console.error("Failed to start actor:", startJson);
      process.exit(1);
  }

  const runId = startJson.data.id;
  console.log("✅ Run started! Run ID:", runId);

  console.log("⏳ Waiting for container to initialize (30s)...");
  await new Promise(r => setTimeout(r, 30000));

  const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
  const runDetail = (await runRes.json() as any).data;
  const baseUrl = runDetail.containerUrl; 
  console.log("📡 Container URL:", baseUrl);

  if (!baseUrl) {
     console.error("❌ No container URL found. Checking logs...");
     process.exit(1);
  }

  const transport = new SSEClientTransport(new URL(`${baseUrl}/sse?token=${token}`));
  const client = new Client({ name: "proof-client", version: "1.0.0" }, { capabilities: {} });
  
  try {
    console.log("🔗 Connecting to SSE endpoint...");
    await client.connect(transport);
    
    console.log("🎯 Connection established! Calling tool: search_web...");
    const result = await client.callTool({
      name: "search_web",
      arguments: {
        query: "latest news about Ernesta Labs and Forage MCP",
        num_results: 3
      }
    });
    
    console.log("\n💎 LIVE RESULTS FROM FORAGE:");
    console.log("============================");
    console.log(JSON.stringify(result, null, 2));
    console.log("============================\n");

    await client.close();
  } catch (err) {
    console.error("❌ Proof failed:");
    console.error(err);
    process.exit(1);
  }
}

proveIt().catch(console.error);
