# FounderX Platform Frequently Asked Questions (FAQ)

## Category 1: General Platform Questions

#### Q1: What is FounderX?
FounderX is a premium social network and matchmaking platform designed for startup founders, early-stage investors, and job seekers looking to join growth companies. It integrates social networking features with structured business workflows like fundraising, recruitment, and document discovery.

#### Q2: Who can join FounderX?
FounderX is open to startup founders, venture capital partners, angel investors, family offices, accelerators, job seekers, co-founders, and industry advisors.

#### Q3: How do I sign up for FounderX?
Navigate to `/auth/signup`, select your role (Founder, Investor, or User), fill in your credentials, and submit. You must verify your email address to activate your account.

#### Q4: Is there a mobile app for FounderX?
Currently, FounderX is optimized as a mobile-responsive web application accessible on all desktop, tablet, and mobile browsers.

#### Q5: Can I change my role after signing up?
Yes. Users can update or expand their role settings via the Account Settings panel (`/settings`).

#### Q6: How does FounderX protect my data?
FounderX implements secure token authentication, rate limiting, and metadata-level security filters on RAG indexing to ensure private files are only visible to authorized users.

#### Q7: What are the core values of FounderX?
Democratization of startup capital, platform transparency, high-trust connections, and AI-enabled discoverability.

#### Q8: How does the platform prevent spam?
FounderX implements a gated mailbox and direct messaging permission checks. Direct chat is locked until a mutual relationship (e.g., mutual follow, accepted application, or accepted investment request) is established.

#### Q9: Can I delete my FounderX account?
Yes. Account deletion is requested via Account Settings (`/settings`), which removes your personal profile and references from the database.

#### Q10: How do I report abusive content or spam?
Click the "Report" button on the post card or profile header. Reports are sent to the admin dashboard for review.

---

## Category 2: Founder & Startup Profiles

#### Q11: How do I create a startup profile?
Go to the Startup Dashboard `/dashboard/founder` and click "Create Startup". Complete the form detailing your company name, industry, stage, and funding goals.

#### Q12: Can I link multiple startups to my founder profile?
Yes. Founders on the Premium plan can create and link multiple startup profiles.

#### Q13: What is a One-Line Pitch?
A concise summary of your startup's value proposition (limited to 150 characters) displayed on discovery cards across the platform.

#### Q14: How do I edit my startup profile details?
Navigate to your startup's profile page and click "Edit Profile" (accessible only to authorized team members).

#### Q15: How do I add team members to my startup?
Go to the team management tab on `/dashboard/founder`, input the candidate's email or username, and send a team invitation.

#### Q16: What happens when an invited team member accepts?
They are added to the startup's `teamMembers` array, listed on the company page, and direct messaging is unlocked between the team.

#### Q17: Can I remove a team member?
Yes. Startup owners can remove team members via the team management tab, which revokes their posting permissions and removes them from the profile.

#### Q18: What is a Founder Score?
A reputation score (0-100) calculated based on profile completion, email verification, active startup pages, and positive network interactions.

#### Q19: How do I upload a pitch deck to my startup?
Go to edit startup profile, navigate to the media section, and upload your PDF deck. You can set the file's visibility to public or private.

#### Q20: Who can view my private pitch deck?
Only investors whom you have accepted connection requests from in the Investment Room can view private files.

#### Q21: What is the maximum file upload size?
The platform enforces a 10MB file size limit for all PDF, DOCX, and TXT documents.

#### Q22: Can I publish posts on behalf of my startup?
Yes. Verified team members can select their startup profile as the author when creating feed posts.

#### Q23: How do I delete a startup profile?
Go to edit startup profile and click "Delete Startup". This action is restricted to the primary owner (`founderId`).

#### Q24: What is the Q&A section for?
A community space where founders can ask questions, share challenges, and get advice from other verified founders.

#### Q25: How do I post a job opening?
On the Startup Dashboard, click "Post Job". Fill in the job title, requirements, location, role type, and salary range.

---

## Category 3: Investor & Deal Flow

#### Q26: Who qualifies as a Verified Investor?
Angel investors, venture capital partners, family office managers, and accelerators who submit proof of accreditation or fund association.

#### Q27: How do I apply for Investor Verification?
Go to `/dashboard/verification-center` and submit your SEC CRD number or fund credentials for review.

#### Q28: What is the Investor Dashboard?
A centralized portal (`/dashboard/investor`) containing deal pipelines, startup watchlists, and investment requests.

#### Q29: How does the Deal Flow Kanban board work?
It organizes active startup connections into stages: Connected, Meeting, Due Diligence, Negotiation, Invested, and Rejected.

#### Q30: How do I move a startup through pipeline stages?
Open the startup's connection page or click their card in the Kanban board, selecting the new stage from the drop-down menu.

#### Q31: What is a Startup Watchlist?
A curated folder where investors can save startup profiles to track their growth and traction posts.

#### Q32: How do I add a startup to my watchlist?
Click the "Save" or "Watchlist" button on any startup discovery card or profile header.

#### Q33: How do I discover startups on FounderX?
Use the startup directory `/startups` to search by stage, industry, location, and funding parameters.

#### Q34: What is an Investment Interest Request?
A formal proposal sent by an investor expressing interest in funding a startup, outlining a target ticket size and investment type.

#### Q35: How do I send an Investment Interest Request?
On the target startup's profile, click "Express Interest", complete the popup form, and submit.

#### Q36: Where does the Investment Interest Request go?
It appears as a structured Mail item in the founder's inbox and triggers a real-time notification.

#### Q37: What happens when a founder accepts my Investment Interest Request?
An **InvestorStartupConnection** is created, direct messaging is unlocked, and a private **Investment Room** is opened.

#### Q38: What is the Investment Room?
A private space shared between a founder and investor for due diligence, sharing financials, and tracking deal progress.

#### Q39: Can other users access our private Investment Room?
No. Access is restricted to the connected founder, team members, and the investor.

#### Q40: How do I record a completed investment?
Move the deal stage to "Invested" in the Investment Room and log the final capital deployed and equity stake.

#### Q41: How do I view monthly metrics of portfolio startups?
Traction updates published by portfolio companies are automatically routed to your dashboard and inbox.

#### Q42: What is the Venture Matchmaker report?
An AI-generated report evaluating a startup's pitch deck and profile against an investor's preferences.

#### Q43: How do I generate a Venture Matchmaker report?
Click "Generate Match Report" on the investor dashboard, selecting the target startup.

#### Q44: Can I filter startups by MRR or user growth?
Yes. Verified Investors on the Premium plan can access advanced metrics filters.

#### Q45: How do I follow a founder's updates?
Click the follow button on their Founder Profile. Their public updates will appear in your main feed.

---

## Category 4: Gated Mailbox & Messaging

#### Q46: How does the gated messaging system work?
Direct chat is locked until a relationship is authorized (mutual follow, shared team, or accepted application/investment request).

#### Q47: Can I send message requests to users?
Yes. Sending a message to someone you don't follow creates a Message Request, which they must accept to unlock direct chat.

#### Q48: What is the difference between Chat and Mailbox?
Chat is for real-time messaging, while the Mailbox (`/inbox`) holds structured requests like job applications or investment proposals.

#### Q49: What is a Custom Role Request?
A proposal sent by a professional looking to join a startup, detailing their skills and how they want to collaborate.

#### Q50: How do I accept a job application in the Mailbox?
Open the application mail item in your inbox and click "Connect" to unlock messaging, or click "Accept" to add them to your team.

#### Q51: How do I delete a mail item?
Click the "Delete" button to move the mail item to your trash folder.

#### Q52: Can I restore a deleted mail item?
Yes. Navigate to `/inbox/trash`, select the mail item, and click "Restore".

#### Q53: Can I edit a message I sent?
Yes, within a 15-minute edit window.

#### Q54: Can I delete a message for everyone?
Yes, within a 1-hour deletion window.

#### Q55: How do message reactions work?
Hover over a message bubble and select an emoji to react to it.

#### Q56: Are chats encrypted?
Chats are encrypted in transit via SSL/TLS and stored securely in the database.

#### Q57: What happens when I block a user?
They cannot message you, view your profile, or send mail requests, and any active chats are locked.

#### Q58: Can I send attachments in chat?
Yes. Click the paperclip icon in the chat input to upload images, PDFs, or documents.

#### Q59: What is the Message Permission setting?
A privacy option allowing you to restrict incoming message requests to verified profiles or mutual connections.

#### Q60: Do I get email alerts for unread messages?
Yes. If you are offline, the system sends summary email digests for unread messages.

---

## Category 5: FounderTV

#### Q61: What is FounderTV?
FounderTV is the platform's video-sharing workspace, enabling founders to showcase short-form pitches and product demos.

#### Q62: What video formats are supported?
`.mp4`, `.mov`, and `.webm` files up to 100MB.

#### Q63: What is a Micro-Pitch?
A short-form pitch video (up to 90 seconds) optimized for mobile viewing and discoverability.

#### Q64: What is a Deep Dive?
A long-form presentation video (up to 15 minutes) for product demos, tutorials, or market walk-throughs.

#### Q65: How do I upload a video to FounderTV?
Go to `/upload`, select your file, add a title, description, and link it to your startup.

#### Q66: Can I upload a custom thumbnail for my video?
Yes, you can upload a custom cover image or let the system extract a frame.

#### Q67: Where do my videos appear?
On the main watch feed `/watch`, your personal profile, and your startup's "Videos" tab.

#### Q68: How do investors discover videos?
Through the `/watch` feed, which lists trending pitches, demos, and categories.

#### Q69: Can I comment on FounderTV videos?
Yes. The watch page includes a comments section for feedback and discussions.

#### Q70: How do I connect with a founder from a video?
The player includes direct action buttons like "Connect" (follow) or "Express Interest" (investment request).

#### Q71: How does the video recommendation algorithm work?
It matches videos to users based on their role, view history, and industry preferences.

#### Q72: Can I embed my FounderTV video on my own website?
Yes. Click "Share", copy the embed code, and paste it into your site's HTML.

#### Q73: Are video views tracked?
Yes. The analytics panel displays unique view counts, average watch time, and completion rates.

#### Q74: Can I associate a video with multiple startups?
No. Each video can only be linked to a single startup profile.

#### Q75: How do I delete a video?
Navigate to the video page or your dashboard uploads list and click "Delete".

---

## Category 6: Trust, Verification & Security

#### Q76: What is a Verification Badge?
A blue checkmark indicating that a founder, investor, or startup profile has been authenticated by the platform.

#### Q77: What documents are required for identity verification?
A government-issued ID (passport, driver's license) and a selfie.

#### Q78: How is my Trust Score calculated?
It aggregates points from email verification (+15), profile completion (+25), ID verification (+25), and business registration (+25).

#### Q79: Can a Trust Score decrease?
Yes, if a user receives spam reports, is blocked by multiple accounts, or posts violating content.

#### Q80: How does rate limiting work?
It caps the number of requests per IP to protect the servers from brute force and DoS attacks.

#### Q81: What is prompt injection shielding?
A security filter scanning inputs to block malicious attempts to hijack the AI's system instructions.

#### Q82: What is context sanitization in RAG?
Scans retrieved document chunks to remove malicious instructions before passing them to the LLM.

#### Q83: Are my uploaded RAG documents private?
Yes. Metadata filters restrict RAG retrieval to public documents or files uploaded by the querying user.

#### Q84: How do I report a security vulnerability?
Submit details via our security reporting form or email `security@founderx.com`.

#### Q85: What are the terms for account suspension?
Accounts verified to be spamming, scraping data, or using false identities are suspended.

---

## Category 7: AI Assistant & RAG

#### Q86: How does the AI Assistant work?
It uses a Retrieval-Augmented Generation (RAG) pipeline to search vector indexes (Pinecone) and generate source-backed answers via Groq.

#### Q87: Where can I use the AI Assistant?
In the floating chatbot panel across the dashboard or on the RAG Assistant page `/rag-assistant`.

#### Q88: How do I ask questions about my uploaded documents?
Upload a document in chat. The AI indexes it, allowing you to ask questions immediately.

#### Q89: What file formats does the AI Assistant support?
PDF, DOCX, and TXT files up to 100MB.

#### Q90: How does the AI Matchmaker find investors?
It compares your startup profile, stage, and pitch details against investor preferences and deal criteria.

#### Q91: What are Cited Sources?
References listed below AI responses, detailing the exact files and match percentages used to generate the answer.

#### Q92: What does the confidence score represent?
A metric indicating the semantic match quality of the retrieved context chunks.

#### Q93: Can the AI Assistant draft posts for me?
Yes. You can ask: *"Draft a build-in-public update about our new user milestone."*

#### Q94: How does the AI handle table extraction?
The PDF parser extracts structural coordinates and formats tables as Markdown tables for the LLM.

#### Q95: Can the AI access external websites?
No. The AI Assistant only has access to the FounderX database and your uploaded documents.

---

## Category 8: Monetization & Pricing

#### Q96: What is the Free tier limit?
1 startup profile, 3 posts/day, 2 video uploads, and 2 investment requests/month.

#### Q97: What does Founder Premium offer?
Unlimited startup profiles, advanced analytics, priority job postings, RAG document indexing, and a premium badge for $49/month.

#### Q98: What does Investor Premium offer?
Advanced filters, unlimited watchlists, Kanban pipelines, and AI matchmaking reports for $199/month.

#### Q99: What is the platform transaction fee?
FounderX charges a 1% transaction fee on escrow payments processed through the startup shop.

#### Q100: How do I manage my subscription billing?
Navigate to the Billing tab in Account Settings `/settings` to upgrade, downgrade, or update payment methods.
