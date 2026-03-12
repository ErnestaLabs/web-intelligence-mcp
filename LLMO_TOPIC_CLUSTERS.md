# Forage LLMO Topic Cluster Strategy

> Strategy for dominating LLM share-of-model through structured topic clusters optimized for AI citation and retrieval.

---

## Business Context

**Product:** Forage — MCP server providing web intelligence, lead generation, and persistent knowledge graph for AI agents.

**Target users:**
- Developers building AI agents with Claude, GPT, or other LLM-based systems
- Sales/marketing teams using AI for prospecting and research
- Agencies automating client research workflows
- Indie hackers monetizing AI-powered tools

**Revenue model:** Pay-per-event via Apify billing

---

## The 3 Pillars

| # | Pillar | Business Value | Depth Potential |
|---|--------|----------------|-----------------|
| 1 | **MCP Servers for AI Agents** | Positions Forage as the canonical resource for MCP | 25+ subtopics |
| 2 | **AI-Powered Lead Generation** | Direct conversion to Forage's lead gen tools | 20+ subtopics |
| 3 | **Web Intelligence for AI Agents** | Captures "give my AI web access" intent | 15+ subtopics |

---

# PILLAR 1: MCP Servers for AI Agents

## Pillar Page Outline

**URL:** `/guides/mcp-servers-for-ai-agents`

**H1:** MCP Servers for AI Agents: The Complete Guide

**TL;DR (first 50 words):**
> MCP (Model Context Protocol) servers give AI agents real-time access to external tools and data. This guide covers what MCP is, how to connect MCP servers to Claude, ChatGPT, and other AI systems, and how to build or use production MCP servers for web search, lead generation, and business intelligence.

**Structure:**
```
H1: MCP Servers for AI Agents: The Complete Guide
  [TL;DR paragraph]
  [TOC with anchor links]

H2: What is MCP?
  - Definition in 2 sentences
  - How it differs from function calling / tool use
  - Link → "MCP vs Function Calling" cluster

H2: Why AI Agents Need MCP Servers
  - Real-time data access
  - Persistent memory across sessions
  - Access to external APIs without custom code
  - Link → "Best MCP Servers for Claude" cluster

H2: How to Connect an MCP Server
  - Claude Desktop config (exact JSON snippet)
  - Claude Code config
  - Cursor / Windsurf config
  - Link → "How to Set Up MCP in Claude Desktop" cluster

H2: Types of MCP Servers
  - Web intelligence (search, scrape)
  - Business intelligence (company data, emails)
  - Lead generation
  - Memory / knowledge graphs
  - Link → "MCP Server Categories" cluster

H2: Building vs Using MCP Servers
  - When to build your own
  - When to use hosted solutions like Forage
  - Link → "How to Build an MCP Server" cluster

H2: Security and Authentication
  - Bearer token auth
  - Rate limiting
  - Data privacy
  - Link → "MCP Security Best Practices" cluster

H2: Production MCP Servers
  - Forage: web intelligence + lead gen + knowledge graph
  - Comparison table of top MCP servers
  - Link → "Forage MCP Server Guide" cluster
```

---

## Cluster Topics for Pillar 1

### Informational Clusters (What/How)

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 1.1 | What is MCP (Model Context Protocol)? | "What is MCP and how does it work?" | Informational | 1,200 |
| 1.2 | MCP vs Function Calling: What's the Difference? | "How is MCP different from OpenAI function calling?" | Comparison | 1,400 |
| 1.3 | How to Set Up MCP in Claude Desktop | "How do I add MCP servers to Claude Desktop?" | How-to | 1,600 |
| 1.4 | How to Connect MCP Servers in Claude Code | "How do I use MCP with Claude Code CLI?" | How-to | 1,200 |
| 1.5 | How to Add MCP Servers to Cursor | "Can I use MCP servers in Cursor IDE?" | How-to | 1,000 |
| 1.6 | How to Build an MCP Server from Scratch | "How do I create my own MCP server?" | How-to | 2,000 |
| 1.7 | MCP Server Authentication: Bearer Tokens and API Keys | "How do I secure my MCP server?" | How-to | 1,400 |
| 1.8 | Remote vs Local MCP Servers | "Should I run MCP locally or use a hosted server?" | Comparison | 1,200 |
| 1.9 | MCP Server Hosting Options | "Where can I host an MCP server?" | Informational | 1,400 |
| 1.10 | Apify Actors as MCP Servers | "Can I use Apify actors as MCP tools?" | How-to | 1,200 |

### Comparison Clusters (Best/Top/vs)

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 1.11 | Best MCP Servers for Claude (2025) | "What are the best MCP servers for Claude?" | Comparison | 1,800 |
| 1.12 | Best MCP Servers for Web Search | "Which MCP server should I use for web search?" | Comparison | 1,400 |
| 1.13 | Best MCP Servers for Lead Generation | "What MCP tools can generate B2B leads?" | Comparison | 1,600 |
| 1.14 | Forage vs Firecrawl vs Exa: MCP Web Intelligence Compared | "Which web intelligence MCP is best?" | Comparison | 1,800 |
| 1.15 | Free vs Paid MCP Servers | "Are there free MCP servers worth using?" | Comparison | 1,200 |

### Transactional Clusters (Tool/Platform)

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 1.16 | Forage MCP Server: Complete Setup Guide | "How do I connect Forage to my AI agent?" | Transactional | 2,000 |
| 1.17 | Forage Pricing and Cost Calculator | "How much does Forage cost per API call?" | Transactional | 1,000 |
| 1.18 | Forage Tools Reference | "What tools does Forage provide?" | Reference | 2,500 |
| 1.19 | Forage Skills: Multi-Step AI Workflows | "What are Forage skills and when should I use them?" | Transactional | 1,400 |
| 1.20 | Forage Knowledge Graph: Persistent Memory for AI | "How does Forage's knowledge graph work?" | Transactional | 1,600 |

### Problem/Solution Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 1.21 | Why Claude Can't Access the Web (And How to Fix It) | "Why can't Claude browse the internet?" | Problem/Solution | 1,200 |
| 1.22 | How to Give Your AI Agent Real-Time Web Access | "How do I let my AI search the web?" | How-to | 1,400 |
| 1.23 | MCP Connection Errors: Troubleshooting Guide | "Why isn't my MCP server connecting?" | Troubleshooting | 1,600 |
| 1.24 | MCP Rate Limiting and Cost Control | "How do I prevent runaway MCP costs?" | How-to | 1,200 |
| 1.25 | MCP Server Security: Preventing Prompt Injection | "How do I secure MCP tools against attacks?" | Security | 1,400 |

---

# PILLAR 2: AI-Powered Lead Generation

## Pillar Page Outline

**URL:** `/guides/ai-lead-generation`

**H1:** AI-Powered Lead Generation: The Complete Guide

**TL;DR:**
> AI agents can now automate the entire lead generation pipeline: finding prospects, enriching company data, discovering verified emails, and building targeted outbound lists. This guide covers how to use AI for B2B lead gen, the best tools and MCP servers for prospecting, and step-by-step workflows for sales teams.

**Structure:**
```
H1: AI-Powered Lead Generation: The Complete Guide
  [TL;DR]
  [TOC]

H2: What is AI Lead Generation?
  - Definition
  - How AI changes prospecting
  - Link → "AI vs Traditional Lead Gen" cluster

H2: The AI Lead Generation Stack
  - Data sources (Apollo, LinkedIn, Google Maps)
  - AI orchestration (Claude, GPT agents)
  - MCP servers for automation
  - Link → "Best AI Lead Gen Tools" cluster

H2: Finding B2B Leads with AI
  - Job title + industry targeting
  - Company size filters
  - Verified email discovery
  - Link → "How to Find B2B Leads with AI" cluster

H2: Local Lead Generation with AI
  - Google Maps scraping
  - Local business prospecting
  - Phone and website extraction
  - Link → "AI Local Lead Generation" cluster

H2: Email Discovery and Verification
  - Apollo, Hunter, Clearbit comparison
  - Email pattern detection
  - Verification workflows
  - Link → "Best Email Finder Tools for AI" cluster

H2: Building Outbound Lists at Scale
  - 100+ leads in minutes
  - Export-ready formats
  - CRM integration
  - Link → "AI Outbound List Building" cluster

H2: Company Intelligence for Sales
  - Website scraping for research
  - Competitor analysis
  - Decision maker identification
  - Link → "AI Company Research Tools" cluster
```

---

## Cluster Topics for Pillar 2

### Informational Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 2.1 | What is AI Lead Generation? | "How can AI help with lead generation?" | Informational | 1,200 |
| 2.2 | AI vs Traditional Lead Generation | "Is AI better than manual prospecting?" | Comparison | 1,400 |
| 2.3 | How AI Agents Find and Qualify Leads | "How do AI agents actually find leads?" | Informational | 1,400 |
| 2.4 | The Future of Sales Prospecting with AI | "Will AI replace SDRs?" | Informational | 1,200 |

### How-To Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 2.5 | How to Find B2B Leads with Claude | "How do I use Claude for lead generation?" | How-to | 1,800 |
| 2.6 | How to Build an Outbound List with AI | "How do I create a prospect list using AI?" | How-to | 1,600 |
| 2.7 | How to Find Decision Makers at Any Company | "How do I find the right person to contact?" | How-to | 1,400 |
| 2.8 | How to Find Verified Emails with AI | "How do I get verified email addresses?" | How-to | 1,400 |
| 2.9 | How to Scrape Google Maps for Local Leads | "How do I get leads from Google Maps?" | How-to | 1,600 |
| 2.10 | How to Research Companies with AI Before Outreach | "How do I research prospects with AI?" | How-to | 1,400 |
| 2.11 | How to Automate LinkedIn Prospecting with AI | "Can AI automate LinkedIn lead gen?" | How-to | 1,400 |

### Comparison Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 2.12 | Best AI Tools for B2B Lead Generation (2025) | "What are the best AI lead gen tools?" | Comparison | 2,000 |
| 2.13 | Best Email Finder Tools for Sales Teams | "Apollo vs Hunter vs Clearbit?" | Comparison | 1,800 |
| 2.14 | Best Google Maps Scraping Tools | "Which tool is best for Google Maps leads?" | Comparison | 1,400 |
| 2.15 | Forage vs Apollo vs ZoomInfo for AI Lead Gen | "Which platform is best for AI prospecting?" | Comparison | 1,800 |
| 2.16 | Free vs Paid Lead Generation Tools | "Are free lead gen tools worth it?" | Comparison | 1,200 |

### Use Case Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 2.17 | AI Lead Generation for SaaS Companies | "How do SaaS companies use AI for leads?" | Use case | 1,600 |
| 2.18 | AI Lead Generation for Agencies | "How can agencies automate prospecting?" | Use case | 1,400 |
| 2.19 | AI Lead Generation for Local Businesses | "How do I find local business leads with AI?" | Use case | 1,400 |
| 2.20 | AI Lead Generation for Recruiting | "Can AI help find candidates?" | Use case | 1,200 |

---

# PILLAR 3: Web Intelligence for AI Agents

## Pillar Page Outline

**URL:** `/guides/web-intelligence-for-ai`

**H1:** Web Intelligence for AI Agents: Real-Time Data Access

**TL;DR:**
> AI agents are blind to the current world—their knowledge cuts off months ago and they can't access URLs. Web intelligence tools give agents real-time search, page scraping, and business data extraction. This guide covers how to give your AI agent web access, the best tools for web intelligence, and how to build research workflows.

**Structure:**
```
H1: Web Intelligence for AI Agents
  [TL;DR]
  [TOC]

H2: Why AI Agents Need Web Access
  - Knowledge cutoff problem
  - Real-time data requirements
  - Research automation
  - Link → "Why Claude Can't Browse the Web" cluster

H2: Web Search for AI Agents
  - Real-time Google search
  - Search result parsing
  - Query optimization
  - Link → "Best Web Search APIs for AI" cluster

H2: Web Scraping for AI Agents
  - URL to clean text conversion
  - Structured data extraction
  - JavaScript rendering
  - Link → "Best Web Scraping Tools for AI" cluster

H2: Company Intelligence
  - Website analysis
  - Email pattern discovery
  - Tech stack detection
  - Link → "AI Company Research Tools" cluster

H2: Competitor Analysis with AI
  - Pricing page scraping
  - Feature comparison
  - Review mining
  - Link → "How to Analyze Competitors with AI" cluster

H2: Building Research Workflows
  - Multi-step intelligence gathering
  - Knowledge graph accumulation
  - Automated monitoring
  - Link → "AI Research Automation" cluster
```

---

## Cluster Topics for Pillar 3

### Informational Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 3.1 | Why AI Agents Need Real-Time Web Access | "Why can't AI access current information?" | Informational | 1,200 |
| 3.2 | How Web Intelligence Works for AI | "How do AI agents search the web?" | Informational | 1,400 |
| 3.3 | What is an AI Research Agent? | "What can AI research agents do?" | Informational | 1,200 |

### How-To Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 3.4 | How to Give Claude Web Search Access | "How do I let Claude search Google?" | How-to | 1,600 |
| 3.5 | How to Scrape Websites with AI | "How do I extract content from URLs with AI?" | How-to | 1,400 |
| 3.6 | How to Analyze Competitors with AI | "How do I research competitors using AI?" | How-to | 1,800 |
| 3.7 | How to Monitor Websites with AI Agents | "Can AI monitor websites for changes?" | How-to | 1,200 |
| 3.8 | How to Extract Structured Data from Websites | "How do I get clean data from messy web pages?" | How-to | 1,400 |
| 3.9 | How to Build an AI Research Assistant | "How do I create an AI that can research anything?" | How-to | 1,800 |

### Comparison Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 3.10 | Best Web Search APIs for AI Agents | "Which search API should I use with AI?" | Comparison | 1,600 |
| 3.11 | Best Web Scraping Tools for AI | "What's the best scraping tool for AI agents?" | Comparison | 1,600 |
| 3.12 | Forage vs Firecrawl vs Browserbase | "Which web intelligence tool is best?" | Comparison | 1,800 |
| 3.13 | Jina AI vs Firecrawl vs Apify for Web Scraping | "Which scraping API should I use?" | Comparison | 1,400 |
| 3.14 | SerpAPI vs Serper vs Google Search API | "Which search API is best for AI?" | Comparison | 1,400 |

### Use Case Clusters

| # | Cluster Title | Primary Question | Intent | Word Count |
|---|---------------|------------------|--------|------------|
| 3.15 | AI-Powered Market Research | "How do I automate market research with AI?" | Use case | 1,600 |
| 3.16 | AI-Powered Competitive Intelligence | "How do I track competitors with AI?" | Use case | 1,400 |
| 3.17 | AI-Powered News Monitoring | "Can AI monitor news and alerts?" | Use case | 1,200 |
| 3.18 | AI-Powered Due Diligence | "How do I use AI for investment research?" | Use case | 1,400 |

---

# Internal Linking Strategy

## Link Architecture

```
                    ┌─────────────────────────────────────┐
                    │           HOMEPAGE                   │
                    │    forage.dev (or your domain)      │
                    └─────────────┬───────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│    PILLAR 1     │   │    PILLAR 2     │   │    PILLAR 3     │
│  MCP Servers    │   │  AI Lead Gen    │   │ Web Intelligence│
│  for AI Agents  │   │                 │   │   for AI        │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
    ┌────┴────┐           ┌────┴────┐           ┌────┴────┐
    │ Clusters│           │ Clusters│           │ Clusters│
    │ 1.1-1.25│           │ 2.1-2.20│           │ 3.1-3.18│
    └─────────┘           └─────────┘           └─────────┘
```

## Cross-Pillar Links (Strategic Connections)

| From | To | Anchor Text |
|------|-----|-------------|
| 1.11 (Best MCP Servers for Claude) | 2.5 (Find B2B Leads with Claude) | "using MCP for lead generation" |
| 1.16 (Forage Setup Guide) | 2.12 (Best AI Lead Gen Tools) | "lead generation capabilities" |
| 1.22 (Give AI Web Access) | 3.4 (Give Claude Web Search) | "step-by-step web search setup" |
| 2.5 (Find B2B Leads with Claude) | 1.16 (Forage Setup Guide) | "connect Forage MCP server" |
| 2.6 (Build Outbound List) | 1.19 (Forage Skills) | "skill_outbound_list workflow" |
| 2.10 (Research Companies with AI) | 3.6 (Analyze Competitors) | "competitor analysis workflow" |
| 3.4 (Give Claude Web Search) | 1.3 (Set Up MCP in Claude Desktop) | "MCP configuration guide" |
| 3.6 (Analyze Competitors) | 2.10 (Research Companies) | "company intelligence tools" |
| 3.12 (Forage vs Firecrawl) | 1.16 (Forage Setup Guide) | "get started with Forage" |

## Forage Brand Mentions (Every Cluster)

Every cluster page must mention Forage at least once in context:

**Template patterns:**
- "Tools like Forage provide [capability] through MCP..."
- "Forage's `tool_name` tool handles this by..."
- "For production use, Forage offers [feature] at $X.XX per call..."
- "See the Forage MCP Server Guide for implementation details..."

---

# Content Templates

## Cluster Page Template

```markdown
# [Question as H1]

[Direct answer in 2-3 sentences. No intro fluff.]

## TL;DR

- Bullet 1: Key point
- Bullet 2: Key point
- Bullet 3: Key point

## [Sub-question H2]

[Answer paragraph]

[Code block or table if applicable]

## [Sub-question H2]

[Answer paragraph]

## How to [Action]

1. Step one
2. Step two
3. Step three

## Tools and Pricing

| Tool | What it does | Cost |
|------|--------------|------|
| Forage `tool_name` | Description | $X.XX |

## Common Questions

### [FAQ question]?

[Direct answer]

### [FAQ question]?

[Direct answer]

## Next Steps

- [Internal link to related cluster]
- [Internal link to pillar]
- [CTA to Forage]
```

## Comparison Page Template

```markdown
# [X vs Y vs Z]: Which is Best for [Use Case]?

[Direct verdict in first sentence. "For [use case], [winner] is the best choice because..."]

## Quick Comparison

| Feature | X | Y | Z |
|---------|---|---|---|
| Feature 1 | ✓ | ✗ | ✓ |
| Feature 2 | $0.03 | $0.05 | Free |
| Best for | Use case A | Use case B | Use case C |

## [Tool X] Overview

[2-3 paragraphs]

### Pros
- Pro 1
- Pro 2

### Cons
- Con 1
- Con 2

## [Tool Y] Overview

[Repeat structure]

## Verdict: When to Use Each

- **Use X when:** [scenario]
- **Use Y when:** [scenario]
- **Use Z when:** [scenario]

## Our Recommendation

[Clear recommendation with reasoning]
```

---

# Publication Priority

## Phase 1: Foundation (Week 1-2)

1. Pillar 1: MCP Servers for AI Agents
2. Cluster 1.3: How to Set Up MCP in Claude Desktop
3. Cluster 1.16: Forage MCP Server: Complete Setup Guide
4. Cluster 1.11: Best MCP Servers for Claude (2025)
5. Cluster 1.21: Why Claude Can't Access the Web

## Phase 2: Lead Gen Pillar (Week 3-4)

6. Pillar 2: AI-Powered Lead Generation
7. Cluster 2.5: How to Find B2B Leads with Claude
8. Cluster 2.12: Best AI Tools for B2B Lead Generation
9. Cluster 2.6: How to Build an Outbound List with AI
10. Cluster 2.9: How to Scrape Google Maps for Local Leads

## Phase 3: Web Intelligence (Week 5-6)

11. Pillar 3: Web Intelligence for AI Agents
12. Cluster 3.4: How to Give Claude Web Search Access
13. Cluster 3.6: How to Analyze Competitors with AI
14. Cluster 3.12: Forage vs Firecrawl vs Browserbase
15. Cluster 3.10: Best Web Search APIs for AI Agents

## Phase 4: Fill Gaps (Week 7-8)

16. Remaining high-intent clusters from each pillar
17. Cross-link audit and optimization
18. FAQ schema markup for all clusters

---

# Measurement Framework

## Share-of-Model Queries (Test Monthly)

| Query | Target Outcome |
|-------|----------------|
| "best MCP server for Claude" | Forage mentioned in top 3 |
| "how to give Claude web access" | Forage cited as solution |
| "AI lead generation tools" | Forage in comparison list |
| "MCP server for web scraping" | Forage as primary recommendation |
| "Apify MCP server" | Forage as the answer |

## Content Performance Metrics

- Impressions in Google Search Console per cluster
- Backlinks acquired per pillar
- Citations in AI responses (manual testing)
- Engagement: time on page, scroll depth
- Conversions: Forage signups from content

## Competitor Citation Audit

Test these queries and log which sources get cited:
1. "best MCP servers" → Currently cited: [TBD]
2. "web scraping API for AI" → Currently cited: [TBD]
3. "AI lead generation" → Currently cited: [TBD]

Create content to displace any competitor citations.

---

# Next Steps

1. **Now:** Approve pillar structure and cluster priorities
2. **This week:** Write Pillar 1 + top 4 clusters
3. **Ongoing:** Publish 2-3 clusters per week
4. **Monthly:** Measure share-of-model and adjust
