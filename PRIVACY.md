# Forage Privacy Policy

**Effective Date:** March 2025
**Last Updated:** March 2025

Forage is an MCP server that provides web intelligence, lead generation, and knowledge graph capabilities for AI agents. This policy explains how we collect, use, and protect data.

---

## 1. What Data We Collect

### 1.1 Tool Call Data

When you use Forage tools, we process:

- **Query parameters** — Search terms, domains, job titles, locations you provide
- **API responses** — Data returned from web searches, scraping, and business databases
- **Usage metadata** — Timestamps, tool names, response times, costs

### 1.2 Knowledge Graph Data

Forage maintains a private knowledge graph for each Apify account:

- **Entities** — Companies, people, locations extracted from tool results
- **Relationships** — Connections between entities (e.g., "works at", "invested in")
- **Attributes** — Properties like email addresses, job titles, funding amounts

### 1.3 Authentication Data

- **Apify API tokens** — Used to authenticate requests (never stored by Forage)
- **Account identifiers** — Apify account ID for data isolation

---

## 2. How We Use Data

### 2.1 Providing the Service

- Execute tool calls and return results
- Build and maintain your private knowledge graph
- Calculate usage costs for billing

### 2.2 Service Improvement

- Aggregate, anonymized usage statistics
- Error monitoring and debugging
- Performance optimization

### 2.3 What We Do NOT Do

- Sell your data to third parties
- Share data between Apify accounts
- Use your data to train AI models
- Store complete API responses long-term (only extracted entities)

---

## 3. Data Storage and Security

### 3.1 Infrastructure

Forage runs on Apify's infrastructure with:

- HTTPS encryption for all connections
- Bearer token authentication
- Data isolation per Apify account
- EU and US data center options (via Apify)

### 3.2 Knowledge Graph Storage

- Entities stored in account-scoped database
- Personal Identifiable Information (PII) stored as one-way hashes where possible
- Email addresses stored in plaintext for tool functionality
- Data retained until account deletion or explicit purge request

### 3.3 Retention

| Data Type | Retention |
|-----------|-----------|
| Tool call logs | 30 days |
| Knowledge graph entities | Until deletion requested |
| Billing records | As required by law |

---

## 4. Data Sharing

### 4.1 Third-Party Services

Forage uses these services to provide functionality:

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Apify | Hosting, billing | Account ID, usage |
| Jina AI | Web scraping | URLs to scrape |
| Business databases | Lead generation | Query parameters |

### 4.2 No Sale of Data

We do not sell, rent, or trade your data to third parties for marketing or advertising purposes.

### 4.3 Legal Requirements

We may disclose data if required by law, court order, or to protect rights and safety.

---

## 5. Your Rights

### 5.1 Access

Request a copy of your knowledge graph data by contacting support.

### 5.2 Deletion

Request deletion of your knowledge graph data:
- Email: support@ernesta.com
- Subject: "Data Deletion Request"

Deletion is processed within 30 days.

### 5.3 Export

Export your knowledge graph data in JSON format via the `get_graph_stats` tool or by contacting support.

### 5.4 Correction

Contact support to correct inaccurate data in your knowledge graph.

---

## 6. Cookies and Tracking

Forage is an API service and does not use cookies. No browser tracking is performed.

---

## 7. Children's Privacy

Forage is not intended for use by individuals under 18. We do not knowingly collect data from children.

---

## 8. International Data Transfers

Data may be processed in the United States and European Union via Apify's infrastructure. By using Forage, you consent to this transfer.

---

## 9. Changes to This Policy

We may update this policy. Changes are posted here with an updated "Last Updated" date. Continued use after changes constitutes acceptance.

---

## 10. Contact

For privacy questions or requests:

- **Email:** support@ernesta.com
- **GitHub:** [github.com/ernestalabs/forage](https://github.com/ernestalabs/forage)

---

## 11. GDPR Compliance (EU Users)

### Legal Basis

- **Contract:** Processing necessary to provide the service you requested
- **Legitimate Interest:** Service improvement and security

### Data Controller

Ernesta Labs is the data controller. Apify acts as a data processor.

### EU Representative

Contact: support@ernesta.com

---

## 12. CCPA Compliance (California Users)

### Your Rights

- Right to know what data we collect
- Right to delete your data
- Right to opt-out of data sale (we do not sell data)
- Right to non-discrimination

### Exercising Rights

Contact support@ernesta.com with your request.

---

*This privacy policy applies to the Forage MCP server operated by Ernesta Labs.*
