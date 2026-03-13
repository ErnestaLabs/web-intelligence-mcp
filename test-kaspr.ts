import 'dotenv/config';

async function testKaspr() {
  const apiKey = process.env.KASPR_API_KEY;
  console.log("Kaspr Key length:", apiKey?.length);
  
  const payload = {
    url: "https://www.linkedin.com/in/william-gates/"
  };

  const res = await fetch("https://api.developers.kaspr.io/profile/linkedin", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "accept-version": "v2.0"
    },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}

testKaspr().catch(console.error);
