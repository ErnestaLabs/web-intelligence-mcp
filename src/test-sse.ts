import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import 'dotenv/config';

async function test() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is missing");

  console.log("Connecting to Apify Actor via SSE with query string token...");
  const transport = new SSEClientTransport(
    new URL("https://ernesta-labs--forage.apify.actor/sse?token=" + token)
  );
  
  try {
    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    console.log("Connecting...");
    await client.connect(transport);
    
    console.log("Connected! Listing tools...");
    const tools = await client.listTools();
    console.log("Tools received:", tools.tools.length);
    
    if (tools.tools.length > 0) {
      console.log("First tool:", tools.tools[0].name);
    }

    console.log("Closing connection...");
    await client.close();
  } catch (err) {
    console.error("Test failed with error:");
    console.dir(err, { depth: null });
    process.exit(1);
  }
}

test().catch(console.error);
