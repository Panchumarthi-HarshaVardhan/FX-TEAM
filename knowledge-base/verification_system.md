# Trust, Verification, and Platform Security Systems

## 1. Introduction
High-trust ecosystems are critical when dealing with proprietary IP, job placement, and venture capital. FounderX implements a multi-tier Verification and Security Framework. 

This model ensures that founders are verified business operators, investors represent authenticated capital pools, and communication is secure from prompt injection and data leaks.

This document outlines the email, startup, and investor verification workflows, Trust Score calculations, and platform security systems.

---

## 2. Verification Pipelines

### A. Email Verification
* **Purpose**: Confirm identity ownership and prevent automated bot registration.
* **Workflow**:
  1. Upon registration, the backend generates a secure, randomized token associated with the user record and sends a verification link via `nodemailer`.
  2. **Restriction**: Until verified, users cannot access `/dashboard` or make key API requests. They are redirected to `/verify-email`.
  3. Clicking the verification link calls `/api/auth/verify-email/:token`, which marks `isEmailVerified` as `true` and redirects them to their dashboard.

### B. Startup Verification
* **Purpose**: Validate that a startup profile represents a legally registered corporate entity.
* **Submitted Evidence**:
  * Articles of Incorporation or Organization.
  * EIN / Tax ID Confirmation Letter.
  * Proof of domain ownership (matching the contact email and website).
* **Workflow**:
  1. The founder submits corporate documentation via `/dashboard/verification-center`.
  2. An admin reviews the documents against public business registries.
  3. Upon approval, the startup profile is updated with `founderVerificationStatus: 'verified'` and receives a verified company badge. This increases the company's search ranking.

### C. Investor Verification
* **Purpose**: Verify that an investor represents an accredited capital partner or institutional fund.
* **Submitted Evidence**:
  * SEC CRD Number (for registered representatives).
  * Proof of active fund management (e.g., website listing, partner confirmation).
  * Accreditation declaration form (for angel investors).
* **Workflow**:
  1. The investor submits credentials via the verification dashboard.
  2. The admin validates CRD records, fund assets, or accreditation status.
  3. Upon approval, the user's role metadata is updated with `investorVerificationStatus: 'verified'`, granting them access to advanced search options and watchlists.

---

## 3. Trust Score & Reputation Mechanisms
To help users evaluate profiles, FounderX calculates a dynamic **Trust Score** (0-100) for every account.

### A. Algorithmic Inputs
The Trust Score is calculated using several weighted variables:
* **Email Verification**: +15 points.
* **Profile Completion**: Up to +25 points (photo, bio, skills, location, portfolio links).
* **Government ID Verification**: +25 points.
* **Entity Verification**: +25 points (Startup or Investor registration approval).
* **Network Activity**: Up to +10 points (mutual connections, content creation, platform age).

### B. Impact of Trust Score
* High Trust Scores improve the visibility of startup profiles on search pages and the public feed.
* Investors can configure their settings to block messages from users with Trust Scores below a certain threshold, protecting them from spam.

---

## 4. Platform Security Model
FounderX protects user data and ensures system stability through several security layers.

### A. Endpoint Security (Rate Limiting & Headers)
* **Helmet Middleware**: Integrated across the Express backend to configure secure HTTP headers (e.g., Content Security Policy, XSS Protection, Frameguard).
* **Rate Limiters**: Configured to prevent denial-of-service (DoS) attacks and brute-force attempts:
  * `authLimiter`: Max 5 login/registration requests per 15 minutes per IP.
  * `followLimiter`: Limits rapid follow toggle requests to prevent user scraping.
  * `ragLimiter`: Limits AI RAG requests to protect LLM token usage.

### B. Prompt Injection Protection
The AI Assistant scans incoming inputs to prevent prompt injection attacks:
* **Inbound Query Scan**: Queries containing phrases like *"ignore previous instructions"* or *"override system prompt"* are blocked immediately with a `400 Bad Request` response.
* **Outbound Context Sanitization**: Text retrieved from Pinecone documents is scanned before being passed to the LLM. If a paragraph contains prompt injection triggers, it is removed and replaced with a security warning, protecting the LLM from jailbreak attempts.

### C. Scoped Metadata Filters
* To prevent unauthorized access to private data, RAG search and retrieval queries include metadata security filters:
  ```javascript
  const filter = {
    $or: [
      { ownerId: { $eq: userId.toString() } },
      { visibility: { $eq: 'public' } }
    ]
  };
  ```
* This ensures that search results only return public documents or documents uploaded by the querying user, maintaining strict data privacy.
