import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function proveIt() {
  const token = "apify_api_tf3Khu1IMjTJEiCE4bIdBYorMzCqSM4vUPgI";
  const url = `https://ernesta-labs--forage.apify.actor/sse?token=${token}`;
  
  console.log("🔗 Connecting to Ernesta Labs Forage...");
  const transport = new SSEClientTransport(new URL(url));
  const client = new Client({ name: "proof-client", version: "1.0.0" }, { capabilities: {} });
  
  try {
    await client.connect(transport);
    console.log("✅ Connected! Fetching results for 'software companies in London'...");
    
    const result = await client.callTool({
      name: "search_web",
      arguments: {
        query: "software companies in London",
        num_results: 5
      }
    });
    
    console.log("\n🚀 LIVE RESULTS FROM FORAGE:");
    console.log("============================");
    if (result.content && result.content[0] && result.content[0].text) {
        console.log(result.content[0].text);
    } else {
        console.log(JSON.stringify(result, null, 2));
    }
    console.log("============================\n");

    await client.close();
  } catch (err) {
    console.error("❌ Proof failed. Note: Ensure the Actor is in 'Running' status on Apify.");
    console.error(err);
    process.exit(1);
  }
}

proveIt().catch(console.error);
