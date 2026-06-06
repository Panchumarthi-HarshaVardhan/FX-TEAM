# Investor Features and Deal Flow Management

## 1. Introduction
FounderX offers a professional workspace tailored specifically for venture capitalists, angel investors, family offices, and accelerators. These features enable investors to discover high-growth startups, perform due diligence, manage investment pipelines, track portfolio performance, and connect securely with founders. 

This document details the onboarding workflow, dashboard tools, discovery engines, and deal flow management capabilities available to Investors.

---

## 2. Investor Onboarding & Profile Verification
Maintaining a secure community requires verifying that all users with the `investor` role are accredited and legitimate capital partners.

### A. The Onboarding Flow
1. **Role Selection**: During registration, the user selects the `investor` role.
2. **Setup Profile**: The user is redirected to `/profile/setup` to specify:
   * **Investor Type**: Angel, VC, Accelerator, Family Office, or Corporate.
   * **Ticket Size**: Minimum and Maximum investment limits (e.g., Min: $50k, Max: $500k).
   * **Preferred Stages**: Idea, MVP, Seed, Series A, Series B+.
   * **Preferred Industries**: High-level sectors (e.g., SaaS, Web3, Biotech, AI).
   * **LinkedIn & Website**: Verified professional web presence.
3. **Verification Request**: Investors must submit proof of accreditation or fund association via the Verification Center. Upon admin approval, the profile is granted a "Verified Investor" badge, which unlocks full startup discovery capabilities.

---

## 3. The Investor Dashboard
The Investor Dashboard (accessible at `/dashboard/investor`) serves as the command center for investment operations. It provides a real-time overview of active deals, startup watchlists, incoming pitch requests, and due diligence pipelines.

### A. Dashboard Components
* **Pipeline Board (Kanban View)**: Displays active startup connections categorized by deal flow stages:
  1. **Connected**: Initial contact established, messaging unlocked.
  2. **Meeting**: Initial pitch call scheduled or completed.
  3. **Due Diligence**: Reviewing financials, tech stacks, and team backgrounds.
  4. **Negotiation**: Term sheet discussions and equity allocation.
  5. **Invested**: Capital deployed, added to Portfolio.
  6. **Rejected**: Terminated discussions (soft close).
* **Watchlist Panel**: A curated list of startups the investor is tracking for future rounds.
* **Notifications & Updates Log**: Highlights recent traction posts or startup updates published by followed or watchlisted companies.

---

## 4. Startup Discovery Engine
Discovering investment opportunities is driven by semantic search, structured filters, and AI-enabled matchmaking.

### A. Search & Filters
Investors access the discovery interface via `/startups` or `/explore`. They can filter opportunities by:
* **Industry Sector**: (e.g., Fintech, ClimateTech, Edtech).
* **Development Stage**: (e.g., Idea, MVP, Traction/Revenue).
* **Funding Needed**: Range-based search matching target ticket sizes.
* **Location**: Geographic preferences.
* **Verification Status**: Restricting results to verified startup profiles.

### B. AI-Powered Matchmaking & RAG Search
Behind the search bar is a Retrieval-Augmented Generation (RAG) system. Investors can type natural language queries, such as:
* *"Find me startups building developer tools in B2B SaaS with an MVP and seeking seed funding under $1M."*
The AI Assistant routes this query to Pinecone, pulls relevant startup profiles and document chunks, evaluates matches, and returns a compiled list with confidence scores and cited sources.

---

## 5. Investment Requests & Mail Actions
When an investor discovers a promising startup, they initiate the investment process by submitting an **Investment Interest Request**.

### A. Sending a Request Workflow
1. The investor navigates to the target startup's profile.
2. They click the **Express Interest** button, which triggers the `SendInterestRequestModal`.
3. The investor inputs:
   * **Interested Amount**: Target deployment sum.
   * **Investment Type**: Equity, SAFE, Convertible Note, or Debt.
   * **Message**: A personalized pitch explaining why they are interested in partnering.
4. **Submission**: This action creates an `InvestmentRequest` record in the database and generates a structured notification and Mail item in the founder's Inbox.

### B. The Mail Action Flow
When the founder opens the Mail item, they have the option to **Accept** or **Reject** the request:
* **Reject**: The request status is set to `rejected`, and a notification is sent to the investor.
* **Accept**: The request status updates to `accepted`, which automatically:
  1. Creates an **InvestorStartupConnection** record.
  2. Generates a confirmation Mail update to the investor.
  3. Unlocks direct messaging (bypassing the mutual follow requirement).
  4. Establishes the **Investment Room** for collaboration.

---

## 6. Deal Flow Management: The Investment Room
The Investment Room (`/dashboard/investor/connection/[connectionId]`) is a private, secure collaboration portal shared between the founder and the connected investor.

### A. Features of the Investment Room
* **Shared Due Diligence Folder**: Founders can link or upload critical documents (e.g., financial projections, tech architecture, legal filings) specifically visible to this investor.
* **Stage Tracking**: The investor can dynamically update the pipeline stage (e.g., moving from "Meeting" to "Due Diligence") using a drop-down menu.
* **Meeting Notes & Action Items**: A shared log where both parties can write and edit meeting outlines, milestones, and next steps.
* **Direct Messaging Sidebar**: An inline chat interface allowing real-time messaging, file uploads, and updates directly inside the context of the deal.

---

## 7. Portfolio Tracking
Once a deal is completed, the investor marks the connection as **Invested** in the Investment Room.

### A. Portfolio Operations
* **Add to Portfolio**: Transitioning to "Invested" prompts the investor to record final metrics (e.g., exact capital deployed, equity percentage acquired).
* **Portfolio Metrics Dashboard**: Aggregates total capital deployed, total companies funded, average equity stake, and portfolio valuation metrics.
* **Founder Updates Log**: Connected founders regularly publish traction updates via their dashboard. These updates are automatically routed to the connected investor's inbox as "founder_update" mail items, allowing the investor to track monthly metrics (users, revenue, growth rate) seamlessly.
