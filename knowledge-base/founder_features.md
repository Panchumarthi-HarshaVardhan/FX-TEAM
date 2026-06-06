# Founder Features and Workflows

## 1. Introduction
FounderX provides a custom suite of tools designed specifically for startup founders. These features enable founders to establish their personal brand, showcase their startups, build team networks, hire talent, and engage directly with investors. 

This document details the user journey, profile structures, dashboards, and community features available to Founders on the platform.

---

## 2. Founder Profiles
A Founder Profile represents the personal brand of a startup creator. It acts as the face of the founder across the community feed, FounderTV, and startup directories.

### A. Key Fields & Data Structure
* **Personal Metadata**: Full Name, unique `@username`, Email, location, and role status.
* **Bio and Professional Summary**: A brief, high-impact headline describing the founder's background, expertise, and current pursuits.
* **Experience & Skills**: A structured list of professional capabilities (e.g., "Full-stack Developer", "Growth Marketing", "B2B SaaS") and a history of previous roles or ventures.
* **Social Connections**: Clickable social links to LinkedIn, Twitter/X, and personal portfolios.
* **Traction & Trust Indicators**: Verification Badges (e.g., "Verified Founder", "Identity Verified") and a dynamically updated Founder Score.
* **Startups Reference**: A list of startup profiles linked to this founder (as the primary creator or team member).

### B. Setup & Editing Workflow
1. **Initial Setup**: During registration, users selecting the `founder` role are redirected to `/profile/setup`. Here they must input their location, profile photo, bio, skills, and links.
2. **Editing**: Profile settings can be updated at any time via `/profile/edit`. Changes made to skills or bios are immediately reflected across all pages and index updates.
3. **Startup Association**: When a founder creates a startup profile, it is automatically associated with their Founder Profile and displayed under their "Associated Startups" section.

---

## 3. Startup Profiles
A Startup Profile is the official company page. It contains business-related metrics, pitches, team structures, jobs, and updates. It serves as the primary evaluation target for investors.

### A. Core Features & Fields
* **One-Line Pitch**: A concise summary of the startup's value proposition (limited to 150 characters) displayed on cards.
* **Detailed Description**: A comprehensive description of the problem, solution, market size, and business model.
* **Industry & Stage**: Categorization fields (e.g., "AI", "Fintech", "Healthtech") and company stage (e.g., "Idea", "MVP", "Seed", "Series A").
* **Funding Metadata**: Current funding goal, amount raised, and equity offered.
* **Team Members**: A listing of associated users, their roles within the startup, and links to their Founder Profiles.
* **Pitch Deck & Media**: Links to uploaded pitch decks, slide presentations, and FounderTV pitch videos.
* **Saves & Followers Count**: Dynamic stats indicating how many investors have saved or followed this startup.

---

## 4. The Startup Dashboard
The Startup Dashboard (accessible at `/dashboard/founder`) is the central control center for founder operations. It aggregates metrics, active job openings, applicant lists, investor inquiries, and team updates.

### A. Dashboard Sections
* **Analytics Panel**: Displays real-time metrics including total profile views, badge views (derived from embedded widgets), job application counts, and active investment requests.
* **Active Deals/Connections**: Shows the pipeline of all active **InvestorStartupConnections** (e.g., "Connected", "Meeting", "Due Diligence", "Negotiation", "Invested"). Clicking on a connection opens the **Investment Room**.
* **Job Board Management**: Allows founders to create new Job Openings, edit existing ones, and review applications.
* **Role Requests Tracker**: Specifically tracks custom, unstructured requests from professionals looking to join as co-founders or key partners.

---

## 5. Founder Networking & Social Features
Networking on FounderX combines standard social interactions with targeted professional actions:

### A. Following System
* Founders can follow other founders, job seekers, and verified investors.
* If a founder and another user follow each other, a **Mutual Follow** is established. This mutual connection updates both users' `following` arrays in the database and unlocks direct messaging capability.

### B. Personal and Startup Feeds
* The main feed (`/feed`) contains text, image, and video posts from the network.
* Founders can publish posts as *themselves* or on behalf of their *startup*. Posting on behalf of a startup is restricted to verified team members and adds the startup's logo and link to the post card headers.
* Feed posts support liking, commenting (threading), saving, and reporting.

---

## 6. Notifications System
The Notification engine provides real-time alerts via socket.io connections and persistent in-app notifications.

### A. Trigger Events
Founders receive notifications when:
* A user **likes** or **comments** on their post or their startup's post.
* A user **mentions** them (`@username`) in a post or comment.
* A user **follows** their personal profile or their startup profile.
* An investor sends an **Investment Interest Request** for their startup.
* A professional submits a **Job Application** or **Custom Role Request**.
* An investor updates a deal pipeline stage in the **Investment Room**.

---

## 7. Profile Verification Workflow
Verification is critical to maintaining a high-trust network. Founders initiate verification via `/dashboard/verification-center`.

### A. Verification Steps
1. **Email Verification**: Confirming access to their email address. In-app alerts prompt users to click the confirmation link sent to their registered inbox.
2. **Identity Verification**: Uploading a government-issued ID and a selfie.
3. **Startup Verification**: Providing business registration documents (e.g., Articles of Organization, EIN letter) linking them as the legal founder.
4. **Outcome**: Upon admin approval, the founder receives a blue verification badge, boosting their Trust Score and visibility in RAG search queries.

---

## 8. Community Interactions
Founders engage with the broader community through:
* **Hashtag Tracking**: Clickable hashtags (e.g., `#buildinpublic`, `#seedround`) in posts that direct users to filtered hashtag search pages.
* **Q&A Section**: A dedicated space where founders can ask technical, growth, or legal questions, allowing other validated community members to respond.
* **Startup Updates**: Periodic public posts that outline traction milestones, which are automatically sent as mail updates to their connected investors.
