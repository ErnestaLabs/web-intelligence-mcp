# Forage MCP — Your Agent Shouldn't Be Dumb

**By Riccardo Minniti / Ernesta Labs** | [director@useforage.xyz](mailto:director@useforage.xyz)

Right now your AI agent is smart — until it needs live data. Then it hallucinates, guesses, or tells you it "can't browse the internet." Your competitors' agents do the same thing. That's the gap.

Forage closes it. One connection. One token. 36 tools that give your agent real-time web intelligence and a knowledge graph that never forgets.

**[website: useforage.xyz](https://useforage.xyz) · [github.com/ErnestaLabs/web-intelligence-mcp](https://github.com/ErnestaLabs/web-intelligence-mcp) · [apify.com/ernesta_labs/forage](https://apify.com/ernesta_labs/forage)**

---

## What Your Agent Can Do Right Now

Search the web. Maybe scrape a page if you set up Puppeteer. Hope the search results are current. Hope the page isn't behind a login wall. And tomorrow? Your agent forgets everything it found today.

That's not intelligence. That's a calculator with a browser extension.

### What changes with Forage:

- **Your agent finds real leads** — not "here's a list of companies I remembered from training data" but live B2B leads with verified emails, titles, LinkedIn profiles. Filtered by job title, location, industry, company size.
- **Your agent knows companies before you do** — domain in, full profile out: website content, funding history, tech stack, hiring signals, competitor positioning, social proof. All from live sources.
- **Your agent builds a memory** — every search, every company lookup, every email discovery feeds a persistent knowledge graph. Your agent searched Stripe last week? It already knows Stripe's competitors, funding, key people, and tech stack. No re-scraping needed.
- **Your agent can reason about what it finds** — causal chains, entity relationships, shock propagation. Not just "here's data" but "here's what happens if X happens to Y."

---

## Your Agent Right Now vs. Your Agent With Forage

| | Without Forage | With Forage |
|---|---|---|
| **Web search** | Guesses or hallucinates | Live results from multiple engines |
| **Company research** | You do it manually | Domain in, full profile out |
| **Email discovery** | "I can't access that" | Verified B2B emails with confidence scores |
| **Lead generation** | Not possible | Hundreds of filtered leads with contact data |
| **Memory** | Forgets everything after session | Persistent graph across all sessions |
| **Context** | Starts from zero each time | Builds on everything it's ever found |
| **Competitor analysis** | Reads their about page | Pricing, reviews, ad strategy, hiring trends, tech stack |
| **Relationships** | Sees isolated facts | Discovers connections between entities you've researched |

---

## The Knowledge Graph — What Your Agent Remembers

Every tool call feeds a growing knowledge graph. Not a cache. Not a log. A structured graph with nearly **1 million entities** and growing — companies, people, domains, funding rounds, competitors, technologies, markets, legal entities, geopolitical events, financial instruments.

Your agent searched for "Stripe" six weeks ago? The graph already knows:

- Stripe's competitors and their positioning
- Key executives and their LinkedIn profiles
- Funding history, investors, valuation trajectory
- Tech stack, hiring patterns, market signals
- Relationships to other entities your agent has researched

The graph uses a **FIBO-aligned ontology** — 150+ entity types spanning finance, technology, geopolitics, markets, legal, biology. Not made-up categories. Real-world ontological structure. 200+ typed relationship types including causal chains, contagion pathways, regime transitions.

When your agent needs to know something, it checks the graph first. What it already knows, it doesn't need to re-learn. What it finds new, it adds. The more your agent uses Forage, the smarter your agent gets.

---

## 36 Tools. One Connection.

### Core Tools (10)

| Tool | What your agent does with it | Cost |
|------|------------------------------|------|
| `search_web` | Search the web, get real results | $0.03 |
| `scrape_page` | Extract clean text from any URL | $0.07 |
| `get_company_info` | Domain → full company profile with contacts | $0.08 |
| `find_emails` | Discover verified B2B emails with confidence scores | $0.10 |
| `find_local_leads` | Find local businesses by type and location | $0.15 |
| `find_leads` | Generate B2B lead lists filtered by title/location/industry | $0.25/100 leads |
| `list_verified_actors` | Browse available data source actors | $0.01 |
| `get_actor_schema` | Get input schema for any actor | $0.01 |
| `call_actor` | Run any data actor with custom input | actor price + 25% |
| `search_apify_store` | Search 1500+ data source actors | **Free** |

### Skills — Multi-Source Intelligence Bundles (13)

Each skill runs multiple data sources in parallel and returns a ready-to-use intelligence package. Your agent calls one tool. It gets the result of 5-8 sources merged together.

| Skill | What your agent gets | Cost |
|-------|----------------------|------|
| `skill_company_dossier` | Full company profile + contacts, funding, tech, LinkedIn | $0.50 |
| `skill_prospect_company` | Up to 20 senior decision-makers with emails and LinkedIn | $0.75 |
| `skill_outbound_list` | 100+ verified leads ready for CRM import | $3.50 |
| `skill_local_market_map` | Up to 100 local businesses with contact info and ratings | $0.80 |
| `skill_decision_maker_finder` | 25 decision-makers by department and seniority tier | $1.00 |
| `skill_competitor_intel` | Pricing, features, reviews, positioning from live sources | $0.80 |
| `skill_competitor_ads` | Active ad copy, landing pages, platforms | $0.65 |
| `skill_job_signals` | Hiring trends, open roles, department breakdown, expansion signals | $0.55 |
| `skill_tech_stack` | Technologies used with detection confidence scores | $0.45 |
| `skill_funding_intel` | Funding rounds, investors, valuation, press coverage | $0.70 |
| `skill_social_proof` | Reviews, ratings, testimonials from Trustpilot, G2, Capterra | $0.55 |
| `skill_market_map` | Complete competitor landscape for any market | $1.20 |
| `skill_kaspr_enrich` | LinkedIn profile enrichment: experience, skills, contact data | $0.75 |

### Graph Tools (14)

| Tool | What your agent does with it | Cost |
|------|------------------------------|------|
| `query_knowledge` | Search the graph for previously discovered entities | $0.05 |
| `enrich_entity` | Full profile with all relationships from the graph | $0.08 |
| `find_connections` | Find relationship paths between any two entities | $0.12 |
| `add_claim` | Store a sourced assertion with confidence score | $0.05 |
| `get_claims` | Retrieve all claims for an entity | $0.05 |
| `add_signal` | Record a time-series data point | $0.05 |
| `get_signals` | Query metrics over time | $0.05 |
| `set_regime` | Label entity state (normal, stressed, pre-tipping, post-event) | $0.03 |
| `get_regime` | Check entity current state | $0.03 |
| `causal_parents` | What drives this entity upstream | $0.08 |
| `causal_children` | What this entity drives downstream | $0.08 |
| `causal_path` | Highest-weight causal path between entities | $0.15 |
| `simulate` | Propagate shock/boost through the graph | $0.25 |
| `get_graph_stats` | Entity and relationship counts | **Free** |

---

## Why Your Agent Doesn't Already Do This

**Web search tools** give your agent search results. That's it. No company profiles. No emails. No leads. No memory. Your agent reads a search result, forms an answer, and forgets everything it found.

**Other scraping tools** let your agent fetch a page. But your agent still has to figure out what to do with it. No entity extraction. No graph storage. No enrichment. No connections between findings.

**Your agent with Forage** searches, scrapes, discovers emails, maps local businesses, profiles companies, finds decision-makers, tracks hiring signals, analyses competitors — and remembers all of it in a graph that compounds over time.

The difference isn't features. It's that your agent stops being amnesiac.

---

## Quick Start

### 1. Get Your Apify Token

Free at [console.apify.com](https://console.apify.com/account/integrations). Takes 30 seconds. Your $5 free credit activates immediately.

### 2. Connect

**Claude Desktop** — add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "forage": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-proxy", "https://ernesta-labs--forage.apify.actor/mcp/sse"],
      "env": { "APIFY_API_TOKEN": "YOUR_APIFY_TOKEN" }
    }
  }
}
```

**Cursor / Windsurf:**

```json
{
  "mcpServers": {
    "forage": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-proxy", "https://ernesta-labs--forage.apify.actor/mcp/sse"],
      "env": { "APIFY_API_TOKEN": "YOUR_APIFY_TOKEN" }
    }
  }
}
```

**Docker:**

```json
{
  "mcpServers": {
    "forage": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "APIFY_API_TOKEN", "ghcr.io/ernestalabs/web-intelligence-mcp:latest"],
      "env": { "APIFY_API_TOKEN": "YOUR_APIFY_TOKEN" }
    }
  }
}
```

**n8n / LangGraph / Custom:** SSE endpoint at `https://ernesta-labs--forage.apify.actor/mcp/sse`. Your Apify token in the Authorization header.

### 3. Tell Your Agent

Add to your agent's system prompt:

> When you need live web data, company info, verified emails, or lead lists, use Forage tools. Each call costs money (shown in responses), so batch operations when possible. Your knowledge graph persists across sessions — check it first before making new web calls.

---

## What $5 Gets You

No credit card. No subscription. Your first $5 is free.

| Spend | Get |
|-------|-----|
| $5 free | 167 web searches, or 71 page scrapes, or 50 email lookups, or 1 full company dossier + 33 searches |
| $10 | ~1,000 tool calls across all features |
| $50 | Full research pipeline: dozens of dossiers, hundreds of searches, thousands of graph queries |

Pay per call. Every response shows the cost. No surprises.

---

## What This Is. What It Isn't.

**This is** an MCP server that gives your agent live web intelligence and persistent memory.

**This is not** a search engine wrapper. Not a RAG system. Not a vector database. Not a chatbot with browsing.

**This is** a 36-tool suite: search, scrape, discover emails, generate leads, profile companies, map markets, track hiring signals, analyse competitors, run causal analysis — all wired into a knowledge graph with nearly 1 million entities.

**This is not** a toy graph with 50 companies someone loaded in. It's a FIBO-aligned ontology with 150+ entity types and 200+ relationship types covering finance, technology, geopolitics, markets, legal, biology. Causal chains. Contagion pathways. Regime transitions. Shock propagation. Real structure.

**This is** pay-per-call. Your agent uses it, you see the cost. Your first $5 is free.

**This is not** a subscription. No monthly fee. No minimum commitment.

---

## Support

- **Email:** [director@useforage.xyz](mailto:director@useforage.xyz)
- **Website:** [useforage.xyz](https://useforage.xyz)
- **GitHub Issues:** [github.com/ErnestaLabs/web-intelligence-mcp/issues](https://github.com/ErnestaLabs/web-intelligence-mcp/issues)
- **Apify Actor:** [apify.com/ernesta_labs/forage](https://apify.com/ernesta_labs/forage)

---

MIT License — Copyright (c) 2026 Riccardo Minniti / Ernesta Labs
