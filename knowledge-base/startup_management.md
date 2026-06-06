# Startup Profile Creation and Growth Management

## 1. Introduction
A Startup Profile on FounderX is the single source of truth for an early-stage company. It represents the collective progress, metrics, team, and assets of a venture. 

For founders, maintaining an updated and verified startup profile is essential for discovering capital and talent. For investors, the startup profile is the primary reference for tracking metrics, due diligence materials, and traction updates.

This document describes the creation workflow, profile management features, team permissions, analytics, and growth tracking features available to founders.

---

## 2. Creating a Startup Profile
Founders create a startup profile to represent their venture on the community feed and directories.

### A. The Creation Workflow
1. **Initiation**: The founder navigates to `/startups/create`.
2. **Basic Details Input**: The form requires:
   * **Company Name**: The official name of the startup.
   * **One-Line Pitch**: A brief value proposition (max 150 characters).
   * **Detailed Description**: A complete description of the problem, solution, and model.
   * **Industry Classification**: Sectors (e.g., Artificial Intelligence, E-commerce, CleanTech).
   * **Stage**: Current status (e.g., Idea, MVP, Traction/Revenue).
   * **Location**: HQ city and country.
3. **Funding Configuration**:
   * **Funding Goal**: Total capital sought for the active round.
   * **Equity Offering**: The percentage of equity allocated to the round.
   * **Stage Target**: Target funding stage (e.g., Pre-seed, Seed, Series A).
4. **Contact Details**: Official startup contact email and website URL.
5. **Submission**: Submitting the form creates the `Startup` document in the database, sets the creator as the `founderId` (owner), and dynamically indexes the profile details for search.

---

## 3. Managing Startup Profiles and Assets
Once created, founders manage startup assets directly from their profile interface or settings space.

### A. Asset & Media Uploads
* **Company Logo & Cover**: Uploading official branding images (managed via cloud-hosted media pipelines).
* **Pitch Deck Integration**: Linking or uploading the slide deck (available for secure investor viewing).
* **Pitch Video**: Adding a URL to a product demo or pitch presentation (which is also indexed for video discovery).

### B. Inline Updates (Traction & Milestones)
* Founders can post updates on behalf of their startup profile. These updates appear in the public feed with the startup's brand styling and are aggregated on the startup's public page.
* Regular posting is recommended as it directly influences the startup's visibility in search queries and enhances its ranking in the discovery feed.

---

## 4. Funding & Financial Information
FounderX provides dedicated fields to track and present financial metrics. This helps match companies with active investors whose investment criteria match the startup's needs.

### A. Funding Fields
* **Funding Needed**: The exact dollar amount requested.
* **Capital Raised**: The sum of all capital secured to date.
* **Equity Offered**: Percentage of equity associated with the active round.
* **SAFE / Note details**: Custom fields indicating convertible note interest rates, valuation caps, or SAFE discount rates.
* **Traction Metrics**: Real-time figures indicating user acquisition, monthly recurring revenue (MRR), and annualized growth rates.

---

## 5. Team Management & Permissions
Startups are collaborative efforts. FounderX enables founders to invite and manage team members.

### A. Inviting Team Members
1. The startup owner navigates to the team management tab on `/dashboard/founder`.
2. They input the email address or `@username` of the person they wish to invite, selecting their target role (e.g., Co-founder, Lead Engineer, Advisor).
3. **Invitation**: This creates a `TeamInvitation` record. The recipient receives a notification and an in-app prompt.
4. **Acceptance**: Accepting the invitation adds the user's ID to the startup's `teamMembers` array, creates a `StartupTeamMember` database entry, and displays their profile link on the startup page.

### B. Role-Based Permissions
* **Founder/Owner (`founderId`)**: Full permissions to edit the startup profile, invite/remove team members, delete the company page, create job openings, manage investor connections, and update financials.
* **Team Members**: Permissions to publish posts/updates on behalf of the startup, view internal team dashboards, and view applicant lists. They cannot edit financials or delete the company page.

---

## 6. Startup Analytics
The analytics suite helps founders understand how their pitch materials are performing and who is interacting with their profile.

### A. Analytics Metrics
* **Profile Views**: The number of unique users visiting the startup profile page.
* **Badge Views**: Tracks how many times the startup's embedded FounderX badge (widget) is loaded on external websites or portfolios.
* **Watchlist Addition Count**: Shows how many investors have added the company to their watchlists.
* **Job Performance**: Click-through rates and application submission metrics for active jobs.

---

## 7. Growth & Traction Tracking
To demonstrate execution capability, founders update their company's traction regularly.

### A. Monthly Sprints & Traction Logs
* Founders can log monthly updates including active users, revenue, and month-over-month growth rates.
* **Founder Updates (Outbox)**: If a founder has active **InvestorStartupConnections** in the "Invested" or "Due Diligence" stages, publishing a new traction update generates a structured alert that lands in the connected investor's mailbox as a `founder_update` mail item.
* This ensures that investors are automatically updated on traction milestones, reducing manual reporting overhead.
