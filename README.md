# Forage — MCP Server for AI Agents

Forage gives AI agents capabilities Claude doesn't have built-in: verified email discovery, B2B lead generation, local business data, and persistent memory across sessions.

**One MCP connection. 25 tools. 12 Skills. Pay per call.**

```json
{
  "mcpServers": {
    "forage": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.apify.com/?tools=ernesta_labs/forage----mcp-server-for-ai-agents", "--header", "Authorization: Bearer YOUR_APIFY_TOKEN"]
    }
  }
}
```

---

## What Forage Does

| Capability | Claude Built-in | Forage |
|------------|----------------|--------|
| Web search | Yes | Yes |
| Read web pages | Yes | Yes |
| **Verified email addresses** | No | Yes — with confidence scores |
| **B2B lead lists** | No | Yes — 100+ leads with emails |
| **Local business data** | No | Yes — phone, rating, hours |
| **Persistent memory** | No | Yes — knowledge graph |
| **Structured JSON output** | Sometimes | Always |

Claude can search the web. Forage adds the business data Claude can't get: verified emails, targeted leads, structured company intelligence, and memory that persists across sessions.

---

## Quick Start

### 1. Get Your API Token

Go to [Apify Console → Settings → Integrations](https://console.apify.com/account/integrations) and copy your Personal API Token.

### 2. Add to Your MCP Client

#### Claude Desktop

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "forage": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.apify.com/?tools=ernesta_labs/forage----mcp-server-for-ai-agents",
        "--header",
        "Authorization: Bearer YOUR_APIFY_API_TOKEN"
      ]
    }
  }
}
```

#### Claude Code (CLI)

Add to `.claude/settings.json` or global settings:

```json
{
  "mcpServers": {
    "forage": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.apify.com/?tools=ernesta_labs/forage----mcp-server-for-ai-agents",
        "--header",
        "Authorization: Bearer YOUR_APIFY_API_TOKEN"
      ]
    }
  }
}
```

#### Cursor

Settings → Features → MCP Servers:

```json
{
  "forage": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://mcp.apify.com/?tools=ernesta_labs/forage----mcp-server-for-ai-agents",
      "--header",
      "Authorization: Bearer YOUR_APIFY_API_TOKEN"
    ]
  }
}
```

#### Windsurf

Add to your MCP configuration:

```json
{
  "forage": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://mcp.apify.com/?tools=ernesta_labs/forage----mcp-server-for-ai-agents",
      "--header",
      "Authorization: Bearer YOUR_APIFY_API_TOKEN"
    ]
  }
}
```

### 3. Restart Your Client

Restart the application. Forage tools appear in the tool list.

### 4. Test It

Ask your AI: *"Find verified emails for people at stripe.com"*

---

## Tools Reference

### Email Discovery

#### `find_emails`

Find verified email addresses for any company domain.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Company domain (e.g., "stripe.com") |
| `limit` | number | No | Max results (default: 10, max: 25) |

**Cost:** $0.10 per call

**Example output:**
```json
{
  "domain": "stripe.com",
  "emails_found": 12,
  "emails": [
    {
      "name": "Sarah Chen",
      "email": "sarah.chen@stripe.com",
      "title": "VP Sales",
      "seniority": "vp",
      "department": "sales",
      "linkedin": "linkedin.com/in/sarahchen",
      "confidence": 94
    }
  ],
  "cost_usd": 0.10
}
```

**Use when:** You need verified contact emails for a specific company.
**Don't use when:** You need general company info without emails — use `get_company_info` instead.

---

### Lead Generation

#### `find_leads`

Generate B2B lead lists with verified emails, filtered by job title, industry, location, and company size.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_title` | string | Yes | Target job title (e.g., "Marketing Director") |
| `location` | string | No | Geographic filter (e.g., "United States") |
| `industry` | string | No | Industry filter (e.g., "SaaS", "Healthcare") |
| `company_size` | string | No | Company size (e.g., "50-200", "500-1000") |
| `num_leads` | number | No | Number of leads (default: 100, max: 1000) |
| `email_status` | string | No | "verified" or "all" (default: "verified") |

**Cost:** $0.25 per 100 leads

**Example output:**
```json
{
  "query": {
    "job_title": "Marketing Director",
    "industry": "SaaS",
    "location": "United States"
  },
  "leads_found": 100,
  "leads": [
    {
      "name": "Alex Rivera",
      "title": "Director of Marketing",
      "company": "Notion",
      "email": "alex.rivera@notion.so",
      "email_verified": true,
      "linkedin": "linkedin.com/in/alexrivera",
      "location": "San Francisco, CA",
      "company_size": "500-1000"
    }
  ],
  "cost_usd": 0.25
}
```

**Use when:** You need a targeted list of prospects for outbound sales.
**Don't use when:** You need leads for a specific company — use `skill_decision_maker_finder` instead.

---

#### `find_local_leads`

Find local businesses with phone numbers, websites, ratings, and addresses.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | Yes | Business type (e.g., "dentist", "plumber") |
| `location` | string | Yes | Location (e.g., "Manchester", "Austin, TX") |
| `radius` | number | No | Search radius in meters (default: 5000) |
| `max_results` | number | No | Max results (default: 20) |

**Cost:** $0.15 per call

**Example output:**
```json
{
  "keyword": "dentist",
  "location": "Manchester",
  "leads_found": 47,
  "leads": [
    {
      "name": "Peel Dental Studio",
      "address": "1 Peel Moat Rd, Stockport",
      "phone": "0161 432 1133",
      "website": "https://peeldentalstudio.co.uk",
      "rating": 4.9,
      "review_count": 312,
      "location": { "lat": 53.4084, "lng": -2.1536 }
    }
  ],
  "cost_usd": 0.15
}
```

**Use when:** You need local service businesses with contact info.
**Don't use when:** You need B2B contacts at tech companies — use `find_leads` instead.

---

### Company Intelligence

#### `get_company_info`

Get website summary and email intelligence for any domain.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Company domain (e.g., "hubspot.com") |
| `find_emails` | boolean | No | Include email discovery (default: true) |

**Cost:** $0.08 per call

**Use when:** You need quick company overview with some contacts.
**Don't use when:** You need comprehensive company profile — use `skill_company_dossier` instead.

---

#### `scrape_page`

Extract clean text content from any URL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Full URL to scrape |

**Cost:** $0.07 per call

**Use when:** You need to read a specific webpage.
**Don't use when:** Claude's built-in page reading works for your use case.

---

#### `search_web`

Real-time web search.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `num_results` | number | No | Number of results (default: 10, max: 20) |

**Cost:** $0.03 per call

**Use when:** Claude's built-in search isn't available or you need results stored in the knowledge graph.
**Don't use when:** Claude's built-in web search works for your query.

---

### Knowledge Graph

Every Forage tool call automatically feeds a private knowledge graph. Over time, your agent accumulates intelligence about companies, people, and relationships.

#### `query_knowledge`

Search your accumulated intelligence.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | string | Yes | Natural language query |
| `entity_type` | string | No | Filter by type: "Company", "Person", "Location", "Industry", "any" |
| `min_confidence` | number | No | Minimum confidence score 0-1 (default: 0.7) |

**Cost:** $0.02 per query

**Example:** After researching 50 companies over several weeks:
```
query_knowledge("fintech companies we've researched with Series B funding")
```

Returns all matching companies from your accumulated data — instantly, without re-fetching.

---

#### `enrich_entity`

Get everything known about a company or domain from your knowledge graph.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | string | Yes | Company name or domain (e.g., "stripe.com") |

**Cost:** $0.03 per call

---

#### `find_connections`

Discover relationships between two entities.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from_entity` | string | Yes | Starting entity |
| `to_entity` | string | Yes | Target entity |
| `max_hops` | number | No | Maximum relationship distance (default: 3) |

**Cost:** $0.05 per call

---

#### `get_graph_stats`

View knowledge graph statistics.

**Cost:** Free

---

### Actor Gateway

Access 1000+ Apify actors through Forage.

#### `list_verified_actors`

Browse curated actors available through Forage.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category (default: "all") |

**Cost:** $0.01 per call

---

#### `get_actor_schema`

Get input schema and pricing for any actor.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actor_id` | string | Yes | Actor ID (e.g., "apify/website-content-crawler") |

**Cost:** $0.01 per call

---

#### `call_actor`

Run any Apify actor.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actor_id` | string | Yes | Actor ID |
| `input` | object | Yes | Actor input parameters |
| `timeout_secs` | number | No | Timeout in seconds (default: 120) |
| `max_cost_usd` | number | No | Cost limit — fails if exceeded |

**Cost:** Actor cost + 25% platform fee

---

## Skills

Skills are multi-step workflows that return complete, structured intelligence packages.

### `skill_company_dossier`

Full company profile with website summary, email patterns, and key contacts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Company domain |

**Cost:** $0.50 | **Returns:** Website summary, email pattern, 10 key contacts with titles

---

### `skill_prospect_company`

Decision makers at a company, sorted by seniority.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Company domain |
| `seniority` | string | No | Filter: "senior,director,vp,c_suite" (default: all senior) |

**Cost:** $0.75 | **Returns:** 15 decision makers with verified emails

---

### `skill_outbound_list`

100 targeted leads with verified emails, ready for CRM export.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_title` | string | Yes | Target job title |
| `location` | string | No | Geographic filter |
| `industry` | string | No | Industry filter |
| `company_size` | string | No | Company size filter |

**Cost:** $3.50 | **Returns:** 100 leads with emails, titles, companies, LinkedIn profiles

---

### `skill_local_market_map`

Every business of a type in a location.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `business_type` | string | Yes | Type of business |
| `location` | string | Yes | Location |

**Cost:** $0.80 | **Returns:** Up to 60 businesses with phones, websites, ratings, hours

---

### `skill_decision_maker_finder`

20 verified decision-maker contacts at any company.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Company domain |
| `departments` | string | No | Filter: "sales,marketing,engineering,executive" |

**Cost:** $1.00 | **Returns:** 20 contacts sorted by seniority

---

### `skill_competitor_intel`

Competitor analysis: pricing, features, and reviews.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `competitor_url` | string | Yes | Competitor website URL |
| `focus` | string | No | "pricing", "features", or "both" (default: "both") |

**Cost:** $0.80 | **Returns:** Scraped pricing pages, feature lists, review summaries

---

### `skill_competitor_ads`

Active ads from a competitor.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `competitor_name` | string | Yes | Company name |
| `competitor_domain` | string | No | Company domain |

**Cost:** $0.65 | **Returns:** Ad library links, ad copy examples, landing pages

---

### `skill_job_signals`

Hiring patterns that reveal company strategy.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_name` | string | Yes | Company name |
| `domain` | string | No | Company domain |

**Cost:** $0.55 | **Returns:** Job listings, hiring trends, department growth signals

---

### `skill_tech_stack`

Technologies and platforms a company uses.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Company domain |

**Cost:** $0.45 | **Returns:** Detected technologies, categories, sources

---

### `skill_funding_intel`

Funding history and investor information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_name` | string | Yes | Company name |
| `domain` | string | No | Company domain |

**Cost:** $0.70 | **Returns:** Funding rounds, amounts, investors, news

---

### `skill_social_proof`

Reviews and testimonials from review platforms.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_name` | string | Yes | Company name |
| `domain` | string | No | Company domain |

**Cost:** $0.55 | **Returns:** Reviews from major platforms, sentiment, key themes

---

### `skill_market_map`

All players in a market with positioning analysis.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `market` | string | Yes | Market description (e.g., "email marketing software") |
| `max_competitors` | number | No | Max competitors to find (default: 10) |

**Cost:** $1.20 | **Returns:** Competitors, positioning, pricing tiers, comparison data

---

## Pricing

Pay per tool call. No subscription. No minimum.

| Category | Tools | Cost Range |
|----------|-------|------------|
| Core tools | search, scrape, company info | $0.03 – $0.15 |
| Email discovery | find_emails | $0.10 |
| Lead generation | find_leads, find_local_leads | $0.15 – $0.25/100 |
| Knowledge graph | query, enrich, connections | $0.02 – $0.05 |
| Skills | Multi-step workflows | $0.45 – $3.50 |

**Free trial:** New Apify accounts include $5 of platform credit.

Set spending limits in [Apify Console → Billing](https://console.apify.com/billing).

---

## Example Workflows

### Sales Prospecting

```
1. "Build me a list of 100 marketing directors at SaaS companies in the US"
   → skill_outbound_list

2. "Get detailed profiles on the top 5 companies from that list"
   → skill_company_dossier (x5)

3. "Find their main competitors"
   → skill_competitor_intel
```

**Total cost:** ~$6.50 for 100 qualified leads with company intelligence

### Local Lead Generation

```
1. "Find all dentists in Leeds"
   → skill_local_market_map

2. "Get the top-rated ones with their contact info"
   → Already included in results
```

**Total cost:** $0.80 for comprehensive local market data

### Competitive Research

```
1. "Analyze Notion's pricing and features"
   → skill_competitor_intel

2. "What's their tech stack?"
   → skill_tech_stack

3. "Show me their recent job postings"
   → skill_job_signals

4. "Find their active ads"
   → skill_competitor_ads
```

**Total cost:** $2.45 for complete competitive intelligence

---

## Privacy & Security

- **Data isolation:** All data is scoped to your Apify account
- **No cross-account sharing:** Your knowledge graph is private
- **Authentication:** Bearer token via Apify API
- **PII handling:** Personal data stored as one-way hashes
- **Audit logs:** All tool calls logged in Apify Console

See our [Privacy Policy](https://forage.dev/privacy) for details.

---

## Support

- **GitHub Issues:** [github.com/ernestalabs/forage](https://github.com/ernestalabs/forage)
- **Apify Support:** Contact through [Apify Console](https://console.apify.com)
- **Email:** support@ernesta.com

---

## FAQ

### Does Forage replace Claude's web search?

No. Claude has built-in web search for general queries. Forage adds capabilities Claude doesn't have: verified emails, B2B leads, local business data, and persistent memory.

### How is data stored?

Every tool call feeds a private knowledge graph scoped to your Apify account. Use `query_knowledge` to search accumulated intelligence.

### Can I use Forage with other AI models?

MCP is model-agnostic. Forage works with any MCP-compatible client. Claude Desktop and Claude Code have native support.

### What's the difference between tools and skills?

Tools perform single operations (search, scrape, find emails). Skills are multi-step workflows that combine multiple operations and return comprehensive results.

### How do I control costs?

Set spending limits in Apify Console. Use `max_cost_usd` parameter when calling actors. Each tool returns its cost in the response.

---

*Forage is built by Ernesta Labs and runs on Apify infrastructure.*
