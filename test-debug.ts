import 'dotenv/config';

async function debugSSE() {
  const token = process.env.APIFY_TOKEN;
  const url = "https://ernesta-labs--forage.apify.actor/sse?token=" + token;
  console.log("Fetching:", url);

  const res = await fetch(url, {
    headers: {
      "Accept": "text/event-stream"
    }
  });

  console.log("Status:", res.status, res.statusText);
  console.log("Headers:");
  for (const [key, value] of res.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  if (res.status === 200 && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log("DATA:", decoder.decode(value, { stream: true }));
    }
  } else {
    console.log("Error body:", await res.text());
  }
}

debugSSE().catch(console.error);
