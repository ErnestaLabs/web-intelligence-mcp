# Forage Usage Examples

Three realistic end-to-end examples demonstrating Forage capabilities.

---

## Example 1: Sales Prospecting Campaign

**Goal:** Build a targeted outbound list of 100 marketing directors at SaaS companies, with company research on top prospects.

### Step 1: Generate Lead List

**User prompt:**
> Build me a list of 100 marketing directors at SaaS companies in the United States

**Claude uses:** `skill_outbound_list`

```json
{
  "job_title": "Marketing Director",
  "industry": "SaaS",
  "location": "United States"
}
```

**Response:**
```json
{
  "query": {
    "job_title": "Marketing Director",
    "industry": "SaaS",
    "location": "United States"
  },
  "leads_found": 100,
  "verified_emails": 94,
  "leads": [
    {
      "name": "Sarah Chen",
      "title": "Director of Marketing",
      "company": "Notion",
      "email": "sarah.chen@notion.so",
      "email_verified": true,
      "linkedin": "linkedin.com/in/sarahchen",
      "location": "San Francisco, CA",
      "company_size": "500-1000",
      "company_website": "notion.so"
    },
    {
      "name": "Marcus Johnson",
      "title": "Marketing Director",
      "company": "Figma",
      "email": "marcus.johnson@figma.com",
      "email_verified": true,
      "linkedin": "linkedin.com/in/marcusjohnson",
      "location": "San Francisco, CA",
      "company_size": "500-1000",
      "company_website": "figma.com"
    }
    // ... 98 more leads
  ],
  "export_formats": ["csv", "json"],
  "cost_usd": 3.50
}
```

### Step 2: Research Top Prospects

**User prompt:**
> Get detailed company profiles for Notion and Figma

**Claude uses:** `skill_company_dossier` (twice)

```json
{
  "domain": "notion.so"
}
```

**Response for Notion:**
```json
{
  "domain": "notion.so",
  "company_name": "Notion",
  "website_summary": {
    "title": "Notion – The all-in-one workspace",
    "description": "A new tool that blends your everyday work apps into one. It's the all-in-one workspace for you and your team.",
    "main_products": ["Workspace", "Docs", "Wikis", "Projects"]
  },
  "email_pattern": "{first}@notion.so",
  "total_employees_estimate": "500-1000",
  "key_contacts": [
    {
      "name": "Ivan Zhao",
      "email": "ivan@notion.so",
      "title": "CEO & Co-founder",
      "seniority": "c_suite",
      "linkedin": "linkedin.com/in/ivanzhao",
      "confidence": 98
    },
    {
      "name": "Sarah Chen",
      "email": "sarah.chen@notion.so",
      "title": "Director of Marketing",
      "seniority": "director",
      "linkedin": "linkedin.com/in/sarahchen",
      "confidence": 94
    }
  ],
  "technologies_detected": ["React", "Node.js", "AWS", "Cloudflare"],
  "recent_news": [
    "Notion raises $275M at $10B valuation",
    "Notion launches AI features"
  ],
  "cost_usd": 0.50
}
```

### Step 3: Competitive Intelligence

**User prompt:**
> What's Notion's pricing and how does it compare to competitors?

**Claude uses:** `skill_competitor_intel`

```json
{
  "competitor_url": "https://notion.so",
  "focus": "pricing"
}
```

**Response:**
```json
{
  "competitor": "Notion",
  "pricing_tiers": [
    {
      "name": "Free",
      "price": "$0",
      "features": ["Unlimited pages", "Share with 10 guests", "7-day history"]
    },
    {
      "name": "Plus",
      "price": "$10/user/month",
      "features": ["Unlimited guests", "30-day history", "Custom domains"]
    },
    {
      "name": "Business",
      "price": "$18/user/month",
      "features": ["SAML SSO", "90-day history", "Advanced permissions"]
    },
    {
      "name": "Enterprise",
      "price": "Custom",
      "features": ["Unlimited history", "Audit log", "Dedicated support"]
    }
  ],
  "pricing_model": "Per user per month",
  "free_trial": "Free tier available",
  "competitors_mentioned": ["Confluence", "Coda", "Slite"],
  "cost_usd": 0.80
}
```

### Total Cost: $5.30

- Lead list (100 leads): $3.50
- Company dossiers (2): $1.00
- Competitor intel: $0.80

### What the Knowledge Graph Learned

After this workflow, querying `query_knowledge("SaaS companies in marketing tech")` returns Notion and Figma with all accumulated data — instantly, without additional API calls.

---

## Example 2: Local Service Business Lead Generation

**Goal:** Find all dentists in Manchester, UK for a dental equipment sales campaign.

### Step 1: Map the Local Market

**User prompt:**
> Find all dentists in Manchester with their contact information

**Claude uses:** `skill_local_market_map`

```json
{
  "business_type": "dentist",
  "location": "Manchester, UK"
}
```

**Response:**
```json
{
  "business_type": "dentist",
  "location": "Manchester, UK",
  "total_found": 47,
  "leads": [
    {
      "name": "Peel Dental Studio",
      "address": "1 Peel Moat Rd, Stockport SK4 4PQ",
      "phone": "+44 161 432 1133",
      "website": "https://peeldentalstudio.co.uk",
      "rating": 4.9,
      "review_count": 312,
      "categories": ["Dentist", "Cosmetic Dentist"],
      "hours": {
        "monday": "9:00 AM - 5:30 PM",
        "tuesday": "9:00 AM - 5:30 PM",
        "wednesday": "9:00 AM - 5:30 PM",
        "thursday": "9:00 AM - 7:00 PM",
        "friday": "9:00 AM - 5:00 PM",
        "saturday": "Closed",
        "sunday": "Closed"
      },
      "location": {
        "lat": 53.4084,
        "lng": -2.1536
      }
    },
    {
      "name": "Church Road Dental Practice",
      "address": "142 Church Rd, Manchester M22 4WP",
      "phone": "+44 161 998 1505",
      "website": "https://churchroaddental.co.uk",
      "rating": 4.7,
      "review_count": 187,
      "categories": ["Dentist", "NHS Dentist"],
      "hours": {
        "monday": "8:30 AM - 6:00 PM",
        "tuesday": "8:30 AM - 6:00 PM",
        "wednesday": "8:30 AM - 6:00 PM",
        "thursday": "8:30 AM - 6:00 PM",
        "friday": "8:30 AM - 5:00 PM",
        "saturday": "Closed",
        "sunday": "Closed"
      },
      "location": {
        "lat": 53.3891,
        "lng": -2.2621
      }
    }
    // ... 45 more dentists
  ],
  "cost_usd": 0.80
}
```

### Step 2: Research Top-Rated Practices

**User prompt:**
> Get more information about Peel Dental Studio's website

**Claude uses:** `scrape_page`

```json
{
  "url": "https://peeldentalstudio.co.uk"
}
```

**Response:**
```json
{
  "url": "https://peeldentalstudio.co.uk",
  "title": "Peel Dental Studio | Private Dentist in Stockport",
  "content": "Welcome to Peel Dental Studio, a modern private dental practice in Stockport, Greater Manchester. We offer a full range of dental treatments including general dentistry, cosmetic dentistry, dental implants, orthodontics, and emergency dental care. Our team of experienced dentists uses the latest technology to provide high-quality care in a comfortable environment...",
  "word_count": 2340,
  "headings": [
    "Our Services",
    "Meet Our Team",
    "Patient Reviews",
    "Book an Appointment"
  ],
  "contact_info": {
    "phone": "0161 432 1133",
    "email": "info@peeldentalstudio.co.uk",
    "address": "1 Peel Moat Rd, Stockport SK4 4PQ"
  },
  "cost_usd": 0.07
}
```

### Step 3: Find Decision Makers

**User prompt:**
> Find email contacts at Peel Dental Studio

**Claude uses:** `find_emails`

```json
{
  "domain": "peeldentalstudio.co.uk"
}
```

**Response:**
```json
{
  "domain": "peeldentalstudio.co.uk",
  "emails_found": 3,
  "email_pattern": "{first}@peeldentalstudio.co.uk",
  "emails": [
    {
      "name": "James Richardson",
      "email": "james@peeldentalstudio.co.uk",
      "title": "Practice Owner",
      "seniority": "owner",
      "confidence": 89
    },
    {
      "name": "Emma Watson",
      "email": "emma@peeldentalstudio.co.uk",
      "title": "Practice Manager",
      "seniority": "manager",
      "confidence": 85
    },
    {
      "name": "Info",
      "email": "info@peeldentalstudio.co.uk",
      "title": "General Inquiries",
      "seniority": "unknown",
      "confidence": 98
    }
  ],
  "cost_usd": 0.10
}
```

### Total Cost: $0.97

- Local market map (47 dentists): $0.80
- Website scrape: $0.07
- Email discovery: $0.10

### Export-Ready Data

The leads can be exported to CSV for CRM import:

```csv
name,address,phone,website,rating,reviews,contact_name,contact_email
Peel Dental Studio,"1 Peel Moat Rd, Stockport SK4 4PQ",+44 161 432 1133,peeldentalstudio.co.uk,4.9,312,James Richardson,james@peeldentalstudio.co.uk
Church Road Dental Practice,"142 Church Rd, Manchester M22 4WP",+44 161 998 1505,churchroaddental.co.uk,4.7,187,,
...
```

---

## Example 3: Competitive Intelligence Deep Dive

**Goal:** Research a competitor (HubSpot) across multiple dimensions: tech stack, funding, hiring, ads, and reviews.

### Step 1: Tech Stack Analysis

**User prompt:**
> What technologies does HubSpot use?

**Claude uses:** `skill_tech_stack`

```json
{
  "domain": "hubspot.com"
}
```

**Response:**
```json
{
  "domain": "hubspot.com",
  "technologies": [
    {
      "name": "React",
      "category": "JavaScript Framework",
      "source": "builtwith"
    },
    {
      "name": "Java",
      "category": "Backend Language",
      "source": "job_listings"
    },
    {
      "name": "AWS",
      "category": "Cloud Infrastructure",
      "source": "builtwith"
    },
    {
      "name": "Elasticsearch",
      "category": "Search",
      "source": "job_listings"
    },
    {
      "name": "Kafka",
      "category": "Message Queue",
      "source": "job_listings"
    },
    {
      "name": "MySQL",
      "category": "Database",
      "source": "job_listings"
    },
    {
      "name": "Redis",
      "category": "Cache",
      "source": "job_listings"
    }
  ],
  "infrastructure_summary": "Modern cloud-native stack on AWS with Java backend and React frontend",
  "cost_usd": 0.45
}
```

### Step 2: Funding History

**User prompt:**
> What's HubSpot's funding history?

**Claude uses:** `skill_funding_intel`

```json
{
  "company_name": "HubSpot",
  "domain": "hubspot.com"
}
```

**Response:**
```json
{
  "company_name": "HubSpot",
  "funding_status": "Public (NYSE: HUBS)",
  "ipo_date": "2014-10-09",
  "ipo_valuation": "$880M",
  "current_market_cap": "$24B",
  "total_funding_raised": "$100.5M",
  "funding_rounds": [
    {
      "date": "2014-03",
      "round": "Series E",
      "amount": "$35M",
      "investors": ["Altimeter Capital", "Cross Creek Advisors"]
    },
    {
      "date": "2012-03",
      "round": "Series D",
      "amount": "$35M",
      "investors": ["Sequoia Capital", "Google Ventures"]
    },
    {
      "date": "2011-03",
      "round": "Series C",
      "amount": "$32M",
      "investors": ["Sequoia Capital", "Scale Venture Partners"]
    }
  ],
  "key_investors": ["Sequoia Capital", "Google Ventures", "General Catalyst"],
  "recent_acquisitions": [
    {
      "company": "The Hustle",
      "date": "2021",
      "purpose": "Media/content"
    },
    {
      "company": "Clearbit",
      "date": "2023",
      "purpose": "Data enrichment"
    }
  ],
  "cost_usd": 0.70
}
```

### Step 3: Hiring Signals

**User prompt:**
> What is HubSpot hiring for? What does this tell us about their strategy?

**Claude uses:** `skill_job_signals`

```json
{
  "company_name": "HubSpot",
  "domain": "hubspot.com"
}
```

**Response:**
```json
{
  "company_name": "HubSpot",
  "total_open_positions": 234,
  "hiring_by_department": {
    "Engineering": 78,
    "Sales": 52,
    "Customer Success": 41,
    "Product": 28,
    "Marketing": 21,
    "Other": 14
  },
  "hiring_by_location": {
    "Cambridge, MA": 89,
    "Remote": 67,
    "Dublin, Ireland": 34,
    "Singapore": 22,
    "Sydney, Australia": 12,
    "Other": 10
  },
  "hot_roles": [
    "Senior Software Engineer - AI/ML",
    "Product Manager - Commerce",
    "Enterprise Account Executive",
    "Solutions Architect"
  ],
  "strategic_signals": [
    {
      "signal": "Heavy AI/ML hiring",
      "interpretation": "Investing in AI-powered features across products"
    },
    {
      "signal": "Commerce product roles",
      "interpretation": "Expanding into e-commerce/payments space"
    },
    {
      "signal": "Enterprise sales focus",
      "interpretation": "Moving upmarket to larger customers"
    }
  ],
  "growth_rate": "Moderate - 15% YoY headcount growth",
  "cost_usd": 0.55
}
```

### Step 4: Advertising Analysis

**User prompt:**
> What ads is HubSpot running?

**Claude uses:** `skill_competitor_ads`

```json
{
  "competitor_name": "HubSpot",
  "competitor_domain": "hubspot.com"
}
```

**Response:**
```json
{
  "competitor_name": "HubSpot",
  "ad_platforms": {
    "facebook": {
      "active_ads": 127,
      "ad_library_url": "https://www.facebook.com/ads/library/?advertiser_id=hubspot",
      "top_themes": ["Free CRM", "Marketing automation", "AI tools"]
    },
    "google": {
      "transparency_url": "https://adstransparency.google.com/advertiser/hubspot",
      "active_ads": "200+",
      "top_keywords": ["CRM software", "marketing automation", "free CRM"]
    }
  },
  "ad_copy_examples": [
    {
      "headline": "Free CRM Software | HubSpot",
      "body": "Get started with free CRM software. No credit card required. Scale as you grow.",
      "cta": "Get Started Free"
    },
    {
      "headline": "AI-Powered Marketing | HubSpot",
      "body": "Create content faster with AI. Automate campaigns. Grow revenue.",
      "cta": "Try Free"
    }
  ],
  "landing_pages": [
    "hubspot.com/products/crm",
    "hubspot.com/products/marketing",
    "hubspot.com/artificial-intelligence"
  ],
  "messaging_themes": [
    "Free tier as entry point",
    "All-in-one platform positioning",
    "AI capabilities as differentiator"
  ],
  "cost_usd": 0.65
}
```

### Step 5: Customer Reviews

**User prompt:**
> What do customers say about HubSpot?

**Claude uses:** `skill_social_proof`

```json
{
  "company_name": "HubSpot",
  "domain": "hubspot.com"
}
```

**Response:**
```json
{
  "company_name": "HubSpot",
  "review_platforms": {
    "g2": {
      "overall_rating": 4.4,
      "total_reviews": 10234,
      "url": "https://www.g2.com/products/hubspot"
    },
    "capterra": {
      "overall_rating": 4.5,
      "total_reviews": 3891,
      "url": "https://www.capterra.com/p/hubspot"
    },
    "trustpilot": {
      "overall_rating": 2.8,
      "total_reviews": 892,
      "url": "https://www.trustpilot.com/review/hubspot.com"
    }
  },
  "sentiment_summary": {
    "positive_themes": [
      "Easy to use interface",
      "Excellent free tier",
      "Good integrations",
      "Strong marketing automation"
    ],
    "negative_themes": [
      "Expensive at scale",
      "Contract lock-in",
      "Limited customization",
      "Support response times"
    ]
  },
  "buyer_personas": [
    "Small business marketing teams",
    "B2B SaaS companies",
    "Agencies managing multiple clients"
  ],
  "competitive_comparisons": [
    "Preferred over Salesforce for SMB",
    "More expensive than Mailchimp",
    "Easier than Marketo"
  ],
  "cost_usd": 0.55
}
```

### Total Cost: $2.90

- Tech stack: $0.45
- Funding intel: $0.70
- Job signals: $0.55
- Competitor ads: $0.65
- Social proof: $0.55

### Knowledge Graph Value

After this research, the knowledge graph contains rich data about HubSpot. Future queries are instant:

```
query_knowledge("What do we know about HubSpot?")
```

Returns all accumulated data: tech stack, funding, hiring, ads, reviews — without additional API calls.

---

## Summary

| Example | Use Case | Tools Used | Total Cost |
|---------|----------|------------|------------|
| 1 | Sales prospecting | skill_outbound_list, skill_company_dossier, skill_competitor_intel | $5.30 |
| 2 | Local lead gen | skill_local_market_map, scrape_page, find_emails | $0.97 |
| 3 | Competitive intelligence | skill_tech_stack, skill_funding_intel, skill_job_signals, skill_competitor_ads, skill_social_proof | $2.90 |

All data feeds the knowledge graph automatically. Subsequent research on the same entities is faster and richer.
