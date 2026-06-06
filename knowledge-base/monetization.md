# FounderX Platform Monetization, Tiers, and Subscriptions

## 1. Introduction
FounderX operates under a multi-tier SaaS monetization model designed to support the growth of founders, investors, and job seekers on the platform. The pricing model balance free, accessible features with premium services that offer advanced analytics, increased outreach limits, and AI-powered workflows.

This document describes the platform's subscription tiers, fee structures, and transactional revenue models.

---

## 2. Subscription Tiers

### A. Free Tier (Basic)
Available to all users upon registration. It enables users to establish a platform presence and engage with the community.
* **For Founders**:
  * Create up to 1 Startup Profile.
  * Publish up to 3 posts per day on the feed.
  * Upload up to 2 videos on FounderTV.
  * Send up to 3 custom role invitations per month.
* **For Investors**:
  * Browse the public startup directory.
  * Follow startups and founders.
  * Maintain a basic watchlist (up to 5 startups).
  * Send up to 2 Investment Interest Requests per month.
* **For Job Seekers**:
  * Set up a basic Job Seeker Profile.
  * Apply for up to 3 job openings per month.
  * Send 1 Custom Role Request per month.

---

## 3. Premium Subscription Plans

### A. Founder Premium (Startup Growth Plan)
Designed for active founders who are hiring, fundraising, and growing their team.
* **Pricing**: $49 / month (billed monthly) or $399 / year (billed annually).
* **Premium Features**:
  * **Unlimited Startup Profiles**: Create and manage multiple startup pages.
  * **Advanced Analytics**: Detailed metrics on profile views, pitch deck downloads, and watchlist additions.
  * **Priority RAG Indexing**: Upload and index up to 50 documents (up to 10MB each) for the AI Assistant.
  * **Priority Job Postings**: Job openings are highlighted on search pages and candidate feeds.
  * **Unlimited FounderTV Uploads**: Publish unlimited short-form and long-form videos.
  * **Extended Mailbox Limits**: Send unlimited team invitations and candidates outreach requests.
  * **Premium Badge**: Verification badge and premium styling on posts.

### B. Investor Premium (Deal Flow Pro)
Designed for active angel investors, venture capital funds, accelerators, and family offices looking to streamline deal sourcing and due diligence.
* **Pricing**: $199 / month (billed monthly) or $1,590 / year (billed annually).
* **Premium Features**:
  * **Advanced Search Filters**: Filter startups by exact metrics (MRR, user count, valuation caps).
  * **Unlimited Watchlists**: Group watchlisted startups into custom folders.
  * **Unlimited Investment Requests**: Send unlimited Investment Interest Requests to founders.
  * **AI-Powered Matchmaking Reports**: Generate matchmaker reports that evaluate startup materials against investment criteria.
  * **Priority Deal Pipeline**: Manage active pipelines on the Kanban board with no limit on active connections.
  * **Investor Portal Access**: Full access to the portfolio analytics suite.
  * **Verified Badge**: Verified Investor badge, increasing response rates from founders.

### C. Candidate Premium (Career Boost Plan)
Designed for job seekers, developers, and designers looking to join early-stage startups.
* **Pricing**: $19 / month (billed monthly) or $149 / year (billed annually).
* **Premium Features**:
  * **Unlimited Job Applications**: Submit unlimited applications to active job openings.
  * **Custom Role Pitching**: Send up to 15 Custom Role Requests (e.g., pitching as a co-founder) per month.
  * **Candidate Analytics**: Track when founders view resumes or portfolio links.
  * **Highlighted Candidate Status**: Profiles appear at the top of founder applicant reviews.
  * **Premium Bio & Portfolio**: Customize profile styling and highlight key achievements.

---

## 4. Platform Revenue Model Summary

| Revenue Stream | Target User | Billing Type | Price | Key Value Delivered |
| :--- | :--- | :--- | :--- | :--- |
| **Founder Premium** | Founders | Monthly / Annual | $49 / mo | Advanced analytics, priority job posting, and RAG document indexing. |
| **Investor Premium** | Investors | Monthly / Annual | $199 / mo | Advanced filters, unlimited watchlists, Kanban pipelines, and AI Matchmaker reports. |
| **Candidate Premium** | Job Seekers | Monthly / Annual | $19 / mo | Unlimited job applications, custom role pitches, and candidate profile highlights. |
| **Platform Fee** | Founders & Investors | Transactional | 1% of transaction | Secure escrow processing for verified startup shop transactions. |

---

## 5. Billing & Subscription Management
Subscription cycles, cancellations, and renewals are managed securely:

### A. Subscription Lifecycle Workflows
1. **Subscription Upgrades**: Users select their plan via the settings billing section (`/settings`). Payment details are processed, updating the user's `subscriptionPlan` status.
2. **Renewal**: Subscriptions renew automatically at the end of each billing cycle unless cancelled.
3. **Cancellation**: Users can cancel their subscription at any time. Features remain active until the end of the current billing cycle, after which the account transitions back to the Free tier.
4. **Downgrade Constraints**: Transitioning back to the Free tier restricts access to premium features (e.g., watchlists are capped at 5 items, and extra documents are disabled until the account is upgraded or items are deleted).
