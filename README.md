# Forage MCP — Web Intelligence & Persistent Knowledge Graph for AI Agents

**By Riccardo Minniti / Ernesta Labs** | [director@useforage.xyz](mailto:director@useforage.xyz)

Forage is a Model Context Protocol (MCP) server that gives AI agents **real-time web intelligence** and a **self-accumulating knowledge graph**. One connection provides 24 tools and 12 multi-step skills: web search, company data, verified B2B emails, local leads, and a graph that remembers everything your agent has ever discovered.

Built on Apify's scraping infrastructure. Powered by FalkorDB for persistent graph storage.

---

**Author:** Riccardo Minniti  
**Organization:** Ernesta Labs  
**Contact:** [director@useforage.xyz](mailto:director@useforage.xyz)  
**Website:** [useforage.xyz](https://useforage.xyz)  
**GitHub:** [github.com/ErnestaLabs/web-intelligence-mcp](https://github.com/ErnestaLabs/web-intelligence-mcp)  
**Apify:** [apify.com/ernesta_labs/forage](https://apify.com/ernesta_labs/forage)  

---

## 🎁 $5 Free Credit — Start Immediately

Every new Forage user gets **$5 free** to explore all 36 tools and 12 skills. No credit card required. No Apify account needed. Just connect and start using it.

That's enough for:
- **167 web searches** ($0.03 each)
- **71 page scrapes** ($0.07 each)
- **62 company profiles** ($0.08 each)
- **50 email lookups** ($0.10 each)
- **1 full company dossier** ($0.50) + **33 web searches**

---

## The Knowledge Graph — Your Agent's Memory

Forage includes a **FalkorDB** property graph that silently accumulates entities and relationships from every tool call. It runs on our infrastructure — you don't set anything up, and you don't manage it.

**What gets stored:**

When your agent calls `search_web`, `get_company_info`, `find_emails`, or any skill, Forage extracts key entities and writes them to the graph:

- **Entities** — Companies, people, domains, locations, industries. Each gets a SHA-256 identity hash for deduplication. If you search for "Stripe" twice, you get one entity — not two.
- **Relationships** — Typed, directed edges: `works_at(Stripe)`, `located_in(San Francisco)`, `has_domain(stripe.com)`, `competes_with(Adyen)`. Not similarity scores — actual named relationships.
- **Claims** — Sourced assertions with confidence scores: *"Stripe raised $6.5B Series E" (source: techcrunch.com, confidence: 0.89)*. Provenance tracked — who said what, where, when.
- **Signals** — Numeric data points attached to entities over time: headcount, revenue, job postings, funding amounts. Queryable as time-series.
- **Regimes** — State labels on entities: `normal`, `stressed`, `pre_tipping`, `post_event`. Set manually or via `simulate`.

**What it's not:**
- Not a vector database. No embeddings, no similarity search.
- Not RAG. It doesn't chunk documents or generate context passages.
- Not conversation memory. It stores structured facts about the world, not chat history.

**When it matters:**

The graph starts empty. After your agent has researched 5-10 companies in a market, it becomes useful — `query_knowledge` returns what you've already found instead of re-scraping the web, `find_connections` reveals relationships between entities you've researched, and `simulate` traces causal chains through the graph. The more you use Forage, the faster and smarter it gets.

```
You search: "Stripe"
  └─ Forage stores: Company(Stripe) → has_domain(stripe.com)
                    → located_in(San Francisco)  
                    → competes_with(Adyen)

You search: "Adyen"  
  └─ Forage stores: Company(Adyen) → located_in(Amsterdam)
                    → competes_with(Stripe)

You call: find_connections(from: "Stripe", to: "Adyen")
  └─ Returns: Stripe ──competes_with──▶ Adyen (direct)
              Stripe ──located_in──▶ San Francisco ──operates_in──▶ SaaS ──operates_in──▶ Amsterdam ──located_in──◀ Adyen (3 hops)
```

### Graph tools

| Tool | What it does | Price |
|------|--------------|-------|
| `query_knowledge` | Search entities by name/type | $0.05 |
| `enrich_entity` | Full profile + all relationships | $0.08 |
| `find_connections` | Path between two entities | $0.12 |
| `add_claim` | Store provenance assertion | $0.05 |
| `get_claims` | Retrieve claims for entity | $0.05 |
| `add_signal` | Record time-series data point | $0.05 |
| `get_signals` | Query metrics over time | $0.05 |
| `set_regime` | Label entity state | $0.03 |
| `get_regime` | Check entity state | $0.03 |
| `causal_parents` | What drives this entity | $0.08 |
| `causal_children` | What this entity drives | $0.08 |
| `causal_path` | Highest-weight causal path | $0.15 |
| `simulate` | Propagate shock/boost through graph | $0.25 |
| `get_graph_stats` | Entity/relationship counts | **Free** |

The graph is **persistent** — stored in FalkorDB on our infrastructure. Your agent's research accumulates across sessions. The more you use Forage, the smarter it gets.

---

## Email Verification — How It Actually Works

We don't just guess email patterns. Each `find_emails` call runs a **4-step verification pipeline**:

### Step 1: Pattern Discovery
Scrape the target domain for email patterns (e.g., `firstname.lastname@domain.com`). Extract from:
- Contact pages, footers, team pages
- Press releases, blog author pages
- WHOIS records, SSL certificates

### Step 2: Candidate Generation
Generate candidate emails using discovered patterns + LinkedIn data. Cross-reference with:
- Company employee listings (if public)
- Job postings with contact info
- Conference speaker lists

### Step 3: SMTP Verification
For each candidate, we perform an SMTP handshake check:
- Connect to the domain's mail server
- Verify the recipient exists (`RCPT TO`)
- Detect catch-all domains (score penalty)
- Detect mailboxes that accept then bounce (honeypots)

### Step 4: Confidence Scoring
Each email gets a confidence score (0-100) based on:

| Signal | Weight | Example |
|--------|--------|---------|
| SMTP accept | 40% | Mail server accepted RCPT TO |
| Pattern match | 25% | Matches known company format |
| LinkedIn match | 20% | Name matches LinkedIn profile |
| Source corroboration | 15% | Found on multiple public sources |

**Return format:**
```json
{
  "email": "sarah.chen@stripe.com",
  "name": "Sarah Chen",
  "title": "VP of Sales",
  "seniority": "vp",
  "department": "sales",
  "linkedin": "linkedin.com/in/sarahchen",
  "confidence": 94,
  "verified": true,
  "verification_steps": ["smtp_accepted", "linkedin_match", "pattern_match"]
}
```

### What "verified" means
- **Confidence 90-100**: SMTP accepted + LinkedIn match + multiple sources. High deliverability.
- **Confidence 70-89**: SMTP accepted or strong pattern match. Good for outreach.
- **Confidence 50-69**: Pattern-based with partial verification. Use with caution.
- **Below 50**: Not returned (filtered out).

---

## Web Intelligence Tools

### Core Tools

| Tool | What it does | Price | Why this price |
|------|--------------|-------|----------------|
| `search_web` | Multi-source search, deduplicated, ranked | $0.03 | Aggregates Brave, Bing, DuckDuckGo + dedup + rank |
| `scrape_page` | Extract clean markdown from any URL | $0.07 | Includes proxy rotation, JavaScript rendering, anti-bot bypass |
| `get_company_info` | Domain → full company profile | $0.08 | Aggregates 5+ data sources: website, LinkedIn, Crunchbase patterns, social profiles |
| `find_emails` | Verified B2B emails with LinkedIn | $0.10 | 4-step verification pipeline above |
| `find_local_leads` | Local businesses by niche + location | $0.15 | Google Maps + enrichment + phone/website extraction |
| `find_leads` | B2B leads by title/industry/location | $0.25/100 leads | $0.0025 per lead — cheaper than any alternative |

### Skills (Multi-Step Workflows)

Skills chain multiple tools into one call, returning ready-to-use intelligence packages:

| Skill | Price | Returns |
|-------|-------|---------|
| `skill_company_dossier` | $0.50 | Full company profile + 10 contacts with emails |
| `skill_prospect_company` | $0.75 | 15 decision makers sorted by seniority + emails |
| `skill_outbound_list` | $3.50 | 100 verified leads ready for CRM import |
| `skill_local_market_map` | $0.80 | Up to 60 local businesses with contact info |
| `skill_decision_maker_finder` | $1.00 | 20 decision makers by seniority tier |
| `skill_competitor_intel` | $0.80 | Pricing, features, reviews, positioning |
| `skill_competitor_ads` | $0.65 | Active ad copy, landing pages, platforms |
| `skill_job_signals` | $0.55 | Hiring trends, open roles, expansion signals |
| `skill_tech_stack` | $0.45 | Technologies used with confidence scores |
| `skill_funding_intel` | $0.70 | Funding rounds, investors, valuation estimates |
| `skill_social_proof` | $0.55 | Reviews, ratings, testimonials aggregated |
| `skill_market_map` | $1.20 | Complete competitor landscape for a market |

---

## Why Forage over other MCP search tools?

| Capability | Forage | Brave Search MCP | Apify MCP | AgentQL |
|------------|--------|------------------|-----------|---------|
| Web search | ✓ | ✓ | ✗ | ✗ |
| Page scraping | ✓ | ✗ | ✓ | ✓ |
| Email discovery | ✓ (4-step verified) | ✗ | ✗ | ✗ |
| B2B leads | ✓ | ✗ | Partial | ✗ |
| Company intelligence | ✓ | ✗ | Partial | ✗ |
| Local businesses | ✓ | ✗ | ✓ | ✗ |
| Persistent knowledge graph | ✓ | ✗ | ✗ | ✗ |
| Causal analysis | ✓ | ✗ | ✗ | ✗ |
| Time-series signals | ✓ | ✗ | ✗ | ✗ |
| Multi-step skills | ✓ (12 skills) | ✗ | ✗ | ✗ |
| Actor gateway (1000+) | ✓ | ✗ | ✓ | ✗ |
| **Free credit to start** | **$5** | **$5** | ✗ | ✗ |

The knowledge graph is the differentiator. Other tools give you a single response. Forage gives you accumulated intelligence — every search, email lookup, and company profile feeds your private graph. After a week of use, your agent knows more about your market than any single search could provide.

---

## Quick Start

### 1. Get Your API Token

Go to [Apify Console → Settings → Integrations](https://console.apify.com/account/integrations) and copy your Personal API Token. Or sign up at [useforage.xyz](https://useforage.xyz) — you'll get $5 free credit.

### 2. Connect to Your AI Client

**Claude Desktop** (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "forage": {
      "command": "npx",
      "args": [
        "-y", "@anthropic/mcp-proxy",
        "https://ernesta-labs--forage.apify.actor/mcp/sse"
      ],
      "env": {
        "APIFY_API_TOKEN": "YOUR_APIFY_TOKEN"
      }
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
      "args": [
        "-y", "@anthropic/mcp-proxy",
        "https://ernesta-labs--forage.apify.actor/mcp/sse"
      ],
      "env": {
        "APIFY_API_TOKEN": "YOUR_APIFY_TOKEN"
      }
    }
  }
}
```

**Docker (recommended for mcp.so):**

```json
{
  "mcpServers": {
    "forage": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "APIFY_API_TOKEN",
        "ghcr.io/ernestalabs/web-intelligence-mcp:latest"
      ],
      "env": {
        "APIFY_API_TOKEN": "YOUR_APIFY_TOKEN"
      }
    }
  }
}
```

**n8n / LangGraph / Custom:** Connect to the SSE endpoint at `https://ernesta-labs--forage.apify.actor/mcp/sse` with your Apify token in the Authorization header.

### 3. System Prompt (Optional)

Add to your agent's system prompt:

> When you need live web data, company info, verified emails, or lead lists, use Forage tools. Each call costs money (shown in responses), so batch operations when possible. Your knowledge graph persists across sessions — check it first before making new web calls.

---

## Examples

### Find 20 HVAC leads in Dallas

```
Call: find_leads
Params: { "industry": "HVAC", "location": "Dallas, TX", "limit": 20 }
Returns: 20 companies with name, phone, website, email, address
Cost: $0.05
```

### Get decision makers at a prospect

```
Call: skill_prospect_company
Params: { "domain": "stripe.com" }
Returns: 15 decision makers with title, email, LinkedIn, seniority
Cost: $0.75
```

### Build a local market map

```
Call: skill_local_market_map
Params: { "business_type": "dentist", "location": "London, UK" }
Returns: 60 dentists with address, phone, website, rating, reviews
Cost: $0.80
```

### Track a company's hiring over time

```
Call: add_signal
Params: { "entity": "Acme Corp", "metric": "job_postings", "value": 45 }
... repeat weekly ...
Call: get_signals
Params: { "entity": "Acme Corp", "metric": "job_postings" }
Returns: Time-series of job postings — hiring trend visible
```

### Find who influenced a deal

```
Call: find_connections
Params: { "from": "Your Company", "to": "Acme Corp" }
Returns: Path through shared connections, events, technologies
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR AI AGENT (Claude, Cursor, n8n)      │
└─────────────────────────┬───────────────────────────────────┘
                          │ MCP Protocol
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FORAGE MCP SERVER (Apify)                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ Web Search │  │   Scraper  │  │  Email Discovery     │  │
│  │ (3 engines)│  │ (rendered) │  │  (4-step pipeline)   │  │
│  └─────┬──────┘  └─────┬──────┘  └──────────┬───────────┘  │
│        └───────────────┼────────────────────┘              │
│                        ▼                                    │
│              ┌─────────────────┐                            │
│              │  Graph Client   │                            │
│              └────────┬────────┘                            │
└───────────────────────┼────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                FORAGE GRAPH API (Railway)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FalkorDB (Redis-compatible)              │  │
│  │  Entities ──── RELATES ────▶ Entities                │  │
│  │  Claims (provenance)                                  │  │
│  │  Signals (time-series)                                │  │
│  │  Regimes (state tracking)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Pricing

Pay per tool call. No subscription. No minimum. Every response includes the cost.

**$5 free credit for every new user.** Start immediately, no credit card required.

| Your spend | What you get |
|-----------|-------------|
| $5 free | 167 searches, or 71 scrapes, or 50 email lookups, or 1 full dossier + 33 searches |
| $10 | ~1,000 tool calls across all features |
| $50 | Full research pipeline: dozens of dossiers, hundreds of searches, thousands of graph queries |

All prices include infrastructure costs: proxy rotation, knowledge graph storage, email verification pipeline, and multi-engine search aggregation.

---

## Limitations

- **Some sites block scraping** — we use proxies + JS rendering, but some sites (LinkedIn, closed social networks) are protected
- **Email accuracy ≠ 100%** — confidence scores reflect real verification, but email addresses can change
- **Knowledge graph is persistent but not portable** — data lives on our FalkorDB instance (export coming soon)
- **Rate limits** — Apify enforces per-account limits; Forage doesn't add extra limits on top

---

## Support & Links

- **Author:** Riccardo Minniti / Ernesta Labs
- **Email:** [director@useforage.xyz](mailto:director@useforage.xyz)
- **Website:** [useforage.xyz](https://useforage.xyz)
- **GitHub:** [github.com/ErnestaLabs/web-intelligence-mcp](https://github.com/ErnestaLabs/web-intelligence-mcp)
- **Issues:** [github.com/ErnestaLabs/web-intelligence-mcp/issues](https://github.com/ErnestaLabs/web-intelligence-mcp/issues)
- **Apify Actor:** [apify.com/ernesta_labs/forage](https://apify.com/ernesta_labs/forage)
- **Documentation:** See [QUICKSTART.md](./QUICKSTART.md) and [EXAMPLES.md](./EXAMPLES.md)

---

## License

MIT License — Copyright (c) 2026 Riccardo Minniti / Ernesta Labs