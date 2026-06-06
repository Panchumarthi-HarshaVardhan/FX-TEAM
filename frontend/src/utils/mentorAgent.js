/**
 * FounderX AI Assistant - Business Mentor & Platform Guide
 * Upgraded with Stem-Based Intent Routing, General Business Mentor Engine, and Defensive Uptime Bounds.
 */

const SYSTEM_PROMPT_INTRO = " **FounderX AI Mentor Advice**\n\n";

const MENTOR_DATA = {
  investors: {
    keywords: ['investor', 'investors', 'vc', 'angel', 'raise money', 'find investors', 'matching process', 'raising funds', 'get funded', 'funding list'],
    route: '/investors',
    short: {
      problem: "Finding the right investors requires targeting rather than spraying pitches.",
      move: "Filter stages and sectors inside FounderX, optimize your profile, and lead with traction.",
      steps: [
        "Go to the **Investors** tab and filter by sector and stage.",
        "Ensure your pitch deck and a 60-second video are uploaded to your Startup profile.",
        "Direct pitch using under 150 words with a clear, concise hook and a feedback request."
      ],
      question: "What industry is your startup in, and have you raised any capital yet?"
    },
    detailed: {
      text: `Securing venture capital or angel funding is a structured, relationship-building game. On FounderX, we streamline this process using our vetted **Investor Database**.

Here is your **Investor Acquisition Master Roadmap**:
1. **Target Sector Alignment**: Navigate to our **Investors** tab. Filter investors by their preferred stage (Pre-Seed, Seed, Series A), vertical (SaaS, AI, Fintech), and average ticket size. Never cold-spam; target angels who have backed similar spaces.
2. **Design the Hook**: On your profile, write a crisp one-liner that details your traction. Example: *"SaaS CRM that reduces customer churn by 35% for logistics startups. $10K MRR growing 15% MoM."*
3. **Upload High-Impact Assets**: Ensure your **Startup Page** is fully loaded with your PDF pitch deck, verified traction metrics, and a short 60-second vertical video pitch. Starts with pitch videos see **4.5x more click-throughs** on FounderX.
4. **Initiate the Direct Pitch**: Use our messaging feature to connect directly. Keep your message under 150 words:
   - *The Problem & Solution (1 sentence)*
   - *Your traction / milestone metrics (1 sentence)*
   - *Clear Call to Action: "Are you open to a 10-minute feedback call next Tuesday?"*
5. **Get Verified**: Complete profile verification to earn the Blue Checkmark, boosting investor reply rates by **300%**.

* Mentor Checklist:*
- [ ] Complete FounderX Startup Profile to 100%
- [ ] Get a "Verified Profile" badge
- [ ] Record a 60-second watch video pitch`,
      actions: ['How to raise funding?', 'Improve my pitch', 'Go to Investors Directory']
    }
  },

  validation: {
    keywords: ['validate', 'validation', 'validate idea', 'customer discovery', 'talk to users', 'validate my idea', 'how to validate'],
    route: '/',
    short: {
      problem: "Building a product without verifying real demand results in high failure rates.",
      move: "Conduct customer discovery interviews and measure user 'skin in the game' before writing code.",
      steps: [
        "Interview 10-15 potential users about their frustrations without pitching your idea.",
        "Set up a simple teaser page with a waitlist call-to-action.",
        "Share the value proposition on the **FounderX Feed** to capture peer feedback."
      ],
      question: "Who is your primary customer, and what problem are you solving for them?"
    },
    detailed: {
      text: `Validating your startup idea is the single most important habit of successful founders. 

Here is your **Complete Validation Framework**:
1. **The Customer Discovery Phase**: Interview 15-20 potential users. Do not pitch them. Instead, ask:
   - *"What is the hardest part about [problem area]?"*
   - *"How do you currently solve this, and what does it cost you?"*
   - *"Why is that solution frustrating?"*
2. **Build a Teaser Landing Page**: Create a simple page outlining your core value proposition and a single CTA (e.g., "Join early access waitlist").
3. **Drive Validation Traffic**: Share your landing page link and value proposition in the **FounderX Feed**. Our community of 10K+ founders is excellent for constructive critiques.
4. **Measure "Skin in the Game"**: True validation is currency, time, or data. If people are willing to pay a pre-order fee, fill out a detailed 10-question application, or use a manual prototype weekly, you have validated demand.

* Pro-Tip:* If users aren't expressing deep frustration with the status quo, they won't pay for your solution. Fall in love with the problem, not your software!`,
      actions: ['Create a startup plan', 'Best business model for my idea', 'Go to Community Feed']
    }
  },

  startup_plan: {
    keywords: ['create a startup plan', 'startup plan', 'business plan', 'startup blueprint', 'how to start', 'launch strategy'],
    route: '/profile',
    short: {
      problem: "Too many founders waste weeks writing long plans instead of launching and learning.",
      move: "Create a 1-page Lean Canvas and set weekly execution milestones.",
      steps: [
        "Draft a Lean Canvas (Problem, Solution, TAM, Channels, Revenue).",
        "Map out a 2-week MVP (Minimum Viable Product) scope.",
        "Complete your **FounderX Profile** to signal co-founders and early testers."
      ],
      question: "Are you building a tech product, and do you need a developer co-founder?"
    },
    detailed: {
      text: `A great startup plan isn't a 50-page PDF document; it's a dynamic roadmap built on testing assumptions.

Here is your **5-Step Startup Blueprint**:
1. **Define the Value Proposition**: Fill out a 1-page Lean Canvas. Detail the Problem, Solution, Key Metrics, Unfair Advantage, Channels, Customer Segments, and Cost vs. Revenue.
2. **Map the MVP (Minimum Viable Product)**: What is the absolute simplest build that delivers core value? Focus on one key flow.
3. **Recruit Core Partners**: Identify if you need a technical partner. Complete your **FounderX Profile** and search for collaborators with complementary skills (e.g. "React", "Sales").
4. **Financial Runway Mapping**: Calculate your "Burn Rate" (monthly spending) and "Runway" (months until cash runs out).
5. **Set Weekly Sprints**: Startups succeed through speed. Focus on 1 key metric each week (e.g., talk to 5 users, build sign-up form).

* Mentor Checklist:*
- [ ] Lean Canvas completed
- [ ] Core metric identified
- [ ] Co-founder expectations written down`,
      actions: ['How do I validate my idea?', 'Best business model for my idea', 'Go to My Profile']
    }
  },

  pitching: {
    keywords: ['improve my pitch', 'improve pitch', 'pitch deck', 'pitching', 'elevator pitch', 'how to pitch', 'pitch tips', 'pitch deck structure', 'deck'],
    route: '/watch',
    short: {
      problem: "Most pitch decks are too long and fail to make a clear business opportunity obvious.",
      move: "Limit your presentation to 10 highly visual slides covering Problem, Solution, Traction, and the Ask.",
      steps: [
        "Refine slide 1 and 2 to explain your startup and problem in under 10 seconds.",
        "Feature your Traction slide prominently to build credibility.",
        "Record a 60-second pitch video and post it to the **FounderX Watch Feed**."
      ],
      question: "Do you have a completed draft of your pitch deck ready to upload?"
    },
    detailed: {
      text: `Investors review hundreds of pitch decks a week. To win, your pitch must be clear, concise, and highlight an undeniable opportunity.

Here is the **10-Slide Gold Standard Pitch Deck Structure**:
1. **The Hook (Slide 1)**: Explain what you do in 5 seconds.
2. **The Problem (Slide 2)**: The specific, painful problem you solve (emotionalize it!).
3. **The Solution (Slide 3)**: Your product. Show a clean interface screenshot or a 1-minute video demo.
4. **Market Size (Slide 4)**: TAM (Total Market), SAM (Serviceable Market), SOM (Obtainable Market).
5. **Business Model (Slide 5)**: How you charge (e.g., subscriptions, marketplace fees).
6. **Traction (Slide 6)**: The hero slide! Active users, growing revenue, waitlist, or partnerships.
7. **Marketing/Growth Plan (Slide 7)**: How you will acquire users efficiently.
8. **Competition (Slide 8)**: Why you are 10x better than existing alternatives.
9. **The Team (Slide 9)**: Why you have the unfair advantage to execute this plan.
10. **The Ask (Slide 10)**: Amount raising and exactly what key milestones that cash unlocks.

* Pitch Boosting on FounderX:*
Upload a **60-second vertical video pitch** to our **Watch** feed. Explain: *Problem → Solution → Traction → Call to Action*. Keep it high energy and natural!`,
      actions: ['How to raise funding?', 'How do I find investors?', 'Explore Pitch Videos']
    }
  },

  cofounders: {
    keywords: ['cofounder', 'co-founder', 'find co-founder', 'find cofounder', 'co-founder tips', 'partner', 'technical partner', 'cofounder tips'],
    route: '/',
    short: {
      problem: "Co-founder disputes are a top cause of early startup failures.",
      move: "Filter collaborators on FounderX by skills, and run a 2-week trial sprint before finalizing equity.",
      steps: [
        "Map your exact skillset gap (e.g. business founder needs technical builder).",
        "Search FounderX users and filter by skills like 'React' or 'AI' and look for the 'Open to Collab' status.",
        "Work on a mini-project for 2 weeks to check communication styles and chemistry."
      ],
      question: "Are you looking for a technical developer or a commercial co-founder?"
    },
    detailed: {
      text: `Building a startup solo is incredibly hard. Having a co-founder with a complementary skillset divides the stress and multiplies your execution speed.

Here is your **Co-founder Recruitment Strategy**:
1. **Identify the Skill Gap**: If you are a business builder (sales, marketing, strategy), look for a technical builder (coder, designer, system architect). If you are a coder, find a commercial powerhouse.
2. **Define Alignment**: Ensure you agree on:
   - *Time commitment* (full-time vs. side-hustle)
   - *Company vision* (building a massive VC-backed scaleup vs. a profitable lifestyle business)
   - *Equity split* (recommend a fair split based on future contribution, not just who had the idea first)
3. **Leverage FounderX Networking**: Filter profiles on the platform using skill tags like "Looking for Co-founder". Review their past posts on our **Feed** to check their work ethic and insights.
4. **Run a 2-Week Trial Sprint**: Before marrying a co-founder legally, work together on a simple test project (e.g. launch a landing page, run 10 customer discovery interviews). Check their communication, speed, and reliability.

* Pro-Tip:* Great developers don't build for free just because you "have an idea". Show them wireframes, user waitlists, or initial sales to prove you are a high-execution partner they can trust!`,
      actions: ['Create a startup plan', 'How do I validate my idea?', 'Go to Community Feed']
    }
  },

  explain_founderx: {
    keywords: ['explain founderx', 'what is founderx', 'founderx features', 'how does founderx work', 'about founderx', 'platform features', 'features'],
    route: '/profile',
    short: {
      problem: "Navigating startup building in isolation is incredibly slow.",
      move: "FounderX provides a premium social ecosystem connecting founders, co-founders, and investors.",
      steps: [
        "Use the **Interactive Feed (/feed)** to post traction updates and network.",
        "Browse the **Investors Directory (/investors)** to match with VCs and angels.",
        "Record 60-second video pitches for our **Watch Feed (/watch)** to boost visibility."
      ],
      question: "Have you set up your FounderX Startup page yet to get discovered?"
    },
    detailed: {
      text: `FounderX is a premium, high-octane social and professional ecosystem built specifically for startup builders, investors, and mentors.

Here is the tour of the key tools available to accelerate your startup:
- **Interactive Feed (/feed)**: The heartbeat of the platform. Share traction milestones, ask for advice, hire talent, and interact with the ecosystem.
- **Startup Pages (/startups)**: Your digital storefront. Create a dedicated startup profile to showcase your metrics, pitch decks, and co-founders.
- **Pitch Watch (/watch)**: Explore or upload short, engaging 60-second video pitches. It's the ultimate tool to showcase your brand personality to investors!
- **Investor Portal (/investors)**: Browse vetted, stage-specific venture capital funds and active angel lists.
- **Unified Inbox (/inbox /messages)**: Slide into direct collaborations or pitch investors using direct messaging with built-in startup link sharing.
- **Verification Badge**: Complete profile steps to earn the coveted **FounderX Blue Badge**, confirming your identity and boosting your outreach response rates by **300%**.

Ready to accelerate? Click below to complete your profile or check the startup feed!`,
      actions: ['How do I create my startup profile?', 'How do I find investors?', 'Explore Pitch Videos']
    }
  },

  raise_funding: {
    keywords: ['how to raise funding', 'how to raise funding?', 'raise funding', 'fundraising basics', 'funding rounds', 'safe note', 'raising money'],
    route: '/investors',
    short: {
      problem: "Fundraising is a full-time sales campaign that quickly stalls without structure.",
      move: "Map your funding stage (SAFE vs priced rounds) and build a targeted funnel of 40 VCs.",
      steps: [
        "Prepare your 'Data Room' ( Delaware C-Corp papers, vestings, cap table, pitch deck).",
        "Add 40-50 stage-appropriate investors from the **FounderX Investors tab**.",
        "Pitch all investors within a tight 3-week window to create momentum and FOMO."
      ],
      question: "Are you raising a Pre-Seed SAFE note or a Seed priced round?"
    },
    detailed: {
      text: `Fundraising is a structured sales funnel. You are selling equity in exchange for fuel to accelerate your validated business model.

Here is the **Fundraising Execution Framework**:
1. **Verify Your Stage**:
   - *Pre-Seed ($50K - $300K)*: Standard is safe notes (SAFE) or convertible notes. Funded by angels, family, or micro-VCs. Focus: MVP and early validation.
   - *Seed ($500K - $2M)*: SAFE or priced equity round. Focus: Proving Product-Market Fit (PMF) and scaling customer acquisition.
   - *Series A ($3M - $15M)*: Priced equity round. Focus: Scaling a highly repeatable business model ($1M+ ARR is standard).
2. **Build a Vetted Investor List**: Add 40-50 relevant investors from the **FounderX Investors tab** who back your sector and stage.
3. **Prepare Your Data Room**: Put your incorporation papers, cap table, pitch deck, user cohort graphs, and financial runway forecasts in a secure folder.
4. **Organize a Concentrated Campaign**: Pitch all investors within a 3-week window. This creates healthy FOMO (Fear Of Missing Out) and speeds up term sheet negotiations.

* Pro-Tip:* Never tell an investor you "just need money to hire developers". Investors invest in *growth systems*, not expense budgets! Explain how $1 in their funding yields $5 in future scale.`,
      actions: ['How do I find investors?', 'Improve my pitch', 'Best business model for my idea']
    }
  },

  business_model: {
    keywords: ['best business model for my idea', 'business model', 'business models', 'how to make money', 'monetize', 'pricing', 'revenue model'],
    short: {
      problem: "Underpricing or choosing the wrong model can stifle growth and product utility.",
      move: "Select a monetization model (SaaS, Marketplace, Usage, Freemium) aligned with customer value.",
      steps: [
        "Use **SaaS** (subscriptions) if your customer gets ongoing utility.",
        "Use **Marketplace** (commissions) if you facilitate peer transactions.",
        "Use **Usage-based** billing if your costs scale directly with user volume."
      ],
      question: "What is your startup idea, and how do users interact with it?"
    },
    detailed: {
      text: `Your business model is the logic of how your startup creates, delivers, and captures economic value. The best model aligns perfectly with how your customer prefers to pay.

Here are the **Top 4 Startup Business Models**:
1. **SaaS (Software as a Service)**: Customers pay a monthly/annual recurring subscription fee (e.g. Slack, Salesforce).
   - *Pros*: Predictable revenue, highly valued by investors (high margins).
   - *Key Metric*: Churn rate (customers leaving) and LTV/CAC ratio.
2. **Transaction Fee / Marketplace**: Charging a commission percentage on transactions passing through your platform (e.g. Airbnb, Stripe, FounderX Shop).
   - *Pros*: Massive scalability, network effects.
   - *Key Metric*: GMV (Gross Merchandise Value) and Take Rate.
3. **Usage-Based / Pay-As-You-Go**: Charging based on consumption (e.g. AWS storage, Twilio per SMS).
   - *Pros*: Lowest barrier to entry for early users; billing scales as they grow.
4. **Freemium**: Offering basic features for free while charging for premium workflows, storage, or telemetry (e.g. LinkedIn Premium, ChatGPT Plus).

* Mentor Framework to Pick Your Model:*
- If your customer gets ongoing, continuous utility: **SaaS**
- If you facilitate buyer-seller matching: **Marketplace**
- If your product cost is highly variable based on server usage: **Usage-Based**
- If you need massive word-of-mouth growth first: **Freemium**`,
      actions: ['How do I validate my idea?', 'Create a startup plan', 'How to raise funding?']
    }
  },

  marketing_sales: {
    keywords: ['grow', 'growth', 'marketing', 'sales', 'acquire', 'acquisition', 'conversion', 'traffic', 'branding', 'brand', 'pr', 'public relations'],
    route: '/',
    short: {
      problem: "Many early-stage startups fail because they spend all their time building instead of talking to customers and selling.",
      move: "Implement a structured daily marketing/sales framework: identify a single growth channel, test it for a week, and double down only if CAC < LTV.",
      steps: [
        "Identify your target customer's exact online hangout (e.g. Subreddit, LinkedIn Group, Twitter hashtag).",
        "Share highly valuable, non-spammy educational content solving a problem related to your domain.",
        "Collect feedback, measure conversion rates, and aim for a 3:1 LTV to CAC ratio."
      ],
      question: "What specific demographic are you trying to reach with your marketing campaigns?"
    },
    detailed: {
      text: `Acquiring early customers is the lifeblood of a startup. Without structured sales loops, your product remains invisible.

Here is your **Traction & Marketing Execution Plan**:
1. **Identify 1 Key Growth Channel**: Do not try to run Ads, SEO, Cold Email, and Social Media all at once. Pick *one* where your audience hangs out (e.g. B2B founders on LinkedIn/FounderX, Gen-Z on TikTok).
2. **Value-First Content Distribution**: Write articles, record short videos, or share detailed walkthroughs about *problems*, not your product features. 80% education, 20% call to action.
3. **Optimize the Conversion Landing Page**: Direct traffic to a clean, fast page with a single clear CTA. Keep your form under 3 fields to maximize conversions.
4. **Measure CAC and LTV**: 
   - *CAC (Customer Acquisition Cost)*: Total sales & marketing spend divided by customers acquired.
   - *LTV (Lifetime Value)*: The total revenue you expect to earn from a customer.
   - Aim for an **LTV:CAC ratio of 3:1** or higher.

* Growth Sprint Checklist:*
- [ ] List 10 online communities where your core target buyer discusses their pain points.
- [ ] Post a value-led update on the FounderX Feed showcasing a customer success story.
- [ ] Set up a basic analytics dashboard to track signups.`,
      actions: ['How do I validate my idea?', 'Create a startup plan', 'Explain FounderX']
    }
  },

  legal_basics: {
    keywords: ['legal', 'incorporate', 'vesting', 'c-corp', 'shares', 'equity', 'incorporation', 'advisor', 'cap table', 'incorporating'],
    route: '/profile',
    short: {
      problem: "Incorrect early equity splits and legal setups can make a startup permanently un-investable.",
      move: "Incorporate as a Delaware C-Corp for VC backing, and always enforce a 4-year vesting schedule with a 1-year cliff.",
      steps: [
        "Use platforms like Stripe Atlas or Clerky to quickly set up a Delaware C-Corp.",
        "Enforce a standard 4-year vesting schedule for all founders to protect equity from early exits.",
        "Maintain a clean cap table from day one and avoid allocating large chunks of equity to advisors."
      ],
      question: "Are you co-founding this startup with others, and have you discussed equity splits yet?"
    },
    detailed: {
      text: `Navigating legal basics properly from day one prevents catastrophic breakdowns when you begin raising venture capital.

Here is your **Startup Legal & Equity Framework**:
1. **Delaware C-Corporation Setup**: If you plan to raise institutional capital, incorporate as a Delaware C-Corp. Investors are highly familiar with Delaware corporate law, making funding rounds fast and standard.
2. **Implement Vesting Schedules**: Never hand out stock outright. The standard setup is a **4-year vesting schedule with a 1-year cliff**:
   - No shares are earned in the first 12 months (the cliff).
   - At month 12, 25% of the shares vest.
   - The remaining 75% vests monthly over the next 36 months.
   - This protects the startup if a co-founder leaves early.
3. **Clean Cap Table Management**: Limit early equity allocations to advisors (standard is 0.2% - 1.0% maximum) and reserve 10% - 15% for an employee stock option pool (ESOP).
4. **IP Assignment Agreements**: Ensure every single founder, contractor, and employee signs an Intellectual Property Assignment agreement, guaranteeing the company owns the code and designs outright.

* Legal Compliance Checklist:*
- [ ] Delaware C-Corp incorporated.
- [ ] Founder agreement signed with standard 4-year vesting schedules.
- [ ] Intellectual Property (IP) Assignment completed for all builders.`,
      actions: ['How to raise funding?', 'How do I find investors?', 'Create a startup plan']
    }
  },

  mindset: {
    keywords: ['mindset', 'grit', 'motivation', 'stress', 'stuck', 'lost', 'mental', 'burnout', 'fear', 'founder stress'],
    route: '/',
    short: {
      problem: "Startup building is a long game, and founder burnout is the silent killer of early-stage startups.",
      move: "Focus on daily incremental progress, build a supportive network of peer founders, and separate your identity from your company.",
      steps: [
        "Connect with 3 fellow founders on the **FounderX Community Feed** to share struggles.",
        "Set realistic weekly milestones instead of overwhelming 6-month goals.",
        "Celebrate small traction wins and prioritize sleep, exercise, and mental recovery."
      ],
      question: "What is the biggest operational challenge that is causing you the most stress right now?"
    },
    detailed: {
      text: `Building a startup is a psychological marathon. Grit and emotional resilience are just as critical as coding or marketing.

Here is the **Founder Mental Resilience Blueprint**:
1. **Separate Identity from Company**: Your startup is an experiment; its performance does not define your self-worth. If an experiment fails, it simply means you need a new hypothesis.
2. **Aggressive Milestone Simplification**: Avoid drowning in 6-month plans. Focus on **weekly micro-sprints**. Ask: *"What is the single most important task this week to move the needle?"*
3. **Establish a Peer Support Circle**: Share frustrations openly with other startup operators. Isolation breeds self-doubt. The **FounderX Community Feed** is an excellent place to connect.
4. **Strict Recovery Boundaries**: Burnout degrades decision-making. Schedule non-negotiable blocks for sleep, physical exercise, and family time. A healthy founder executes 10x faster.

* Mental Resilience Checklist:*
- [ ] Define one key weekly sprint target and ignore all other noise.
- [ ] Connect with an active peer founder on FounderX for feedback.
- [ ] Schedule at least 30 minutes of physical movement daily.`,
      actions: ['Create a startup plan', 'How do I validate my idea?', 'Go to Community Feed']
    }
  }
};

const BUSINESS_DOMAIN_TERMS = [
  'startup', 'business', 'marketing', 'sales', 'growth', 'acquisition', 'conversion',
  'revenue', 'funding', 'investor', 'equity', 'shares', 'cap table', 'saas', 'marketplace',
  'mvp', 'prototype', 'product', 'design', 'seo', 'hiring', 'recruiting', 'partner',
  'co-founder', 'cofounder', 'valuation', 'burn rate', 'runway', 'pitch', 'deck', 'branding',
  'brand', 'pr', 'customer', 'user', 'traffic', 'monetize', 'pricing', 'scale', 'scaling',
  'incorporate', 'legal', 'trademark', 'vesting', 'options', 'esop', 'advisor', 'mentor',
  'incubator', 'accelerator', 'syndicate', 'convertible', 'safe note', 'debt', 'bootstrapping',
  'traction', 'churn', 'cac', 'ltv', 'mrr', 'arr', 'pmf', 'product-market fit', 'agile', 'scrum'
];

/**
 * Dynamically extracts the core business concept from user prompts.
 */
function extractBusinessSubject(normalizedText) {
  const prefixes = ['how to ', 'how do i ', 'what is ', 'why does ', 'about ', 'help me with ', 'how can i ', 'tips for ', 'guide to ', 'advice on '];
  for (const prefix of prefixes) {
    const idx = normalizedText.indexOf(prefix);
    if (idx !== -1) {
      const subject = normalizedText.substring(idx + prefix.length).trim();
      if (subject) return subject;
    }
  }

  const foundTerm = BUSINESS_DOMAIN_TERMS.find(term => normalizedText.includes(term));
  if (foundTerm) return foundTerm;
  
  return "your startup roadmap";
}

/**
 * Normalizes user freeform text to exact Mongoose Schema Category enums.
 */
export function normalizeIndustry(input) {
  if (!input) return 'Other';
  const clean = input.toLowerCase().trim();
  if (clean.includes('ai') || clean.includes('ml') || clean.includes('machine learning') || clean.includes('artificial')) return 'AI/ML';
  if (clean.includes('saas') || clean.includes('software') || clean.includes('sub')) return 'SaaS';
  if (clean.includes('blockchain') || clean.includes('crypto') || clean.includes('web3') || clean.includes('ledger')) return 'Blockchain';
  if (clean.includes('tech') || clean.includes('hardware') || clean.includes('deep')) return 'Technology';
  if (clean.includes('health') || clean.includes('medical') || clean.includes('clinical') || clean.includes('bio')) return 'Healthcare';
  if (clean.includes('finance') || clean.includes('fintech') || clean.includes('pay') || clean.includes('bank')) return 'Finance';
  if (clean.includes('learn') || clean.includes('edu') || clean.includes('school') || clean.includes('teach')) return 'Education';
  if (clean.includes('shop') || clean.includes('e-commerce') || clean.includes('store') || clean.includes('retail')) return 'E-commerce';
  if (clean.includes('clean') || clean.includes('green') || clean.includes('solar') || clean.includes('eco')) return 'CleanTech';
  if (clean.includes('food') || clean.includes('agri') || clean.includes('farm') || clean.includes('eat')) return 'FoodTech';
  if (clean.includes('fashion') || clean.includes('style') || clean.includes('wear')) return 'Fashion';
  if (clean.includes('estate') || clean.includes('real') || clean.includes('property')) return 'Real Estate';
  if (clean.includes('transport') || clean.includes('logistics') || clean.includes('cargo') || clean.includes('drive')) return 'Transportation';
  return 'Other';
}

/**
 * Optimizes descriptions.
 */
export function optimizeStartupDescription(name, rawDescription, industry) {
  if (!rawDescription) return "";
  const cleanDesc = rawDescription.trim().replace(/^[iI]\s+/, '').replace(/^we\s+/, '');
  return `${name} is an innovative ${industry} platform built to tackle key challenges in modern workflows. By leveraging advanced systems, it ${cleanDesc.toLowerCase()}. Structured to enable seamless scaling, deep utility, and high performance.`;
}

/**
 * Optimizes Founder Bios for Profile Upgrades.
 */
export function optimizeFounderBio(role, rawBio) {
  if (!rawBio) return "";
  const cleanBio = rawBio.trim();
  return `Highly motivated startup operator acting as ${role}. Dedicated to scaling early-stage architectures, proving customer value loops, and driving execution systems. Experienced in: ${cleanBio}.`;
}

/**
 * Formats dynamic post content.
 */
export function formatTrendingPostTags(title, content) {
  const hashtags = ['#FounderX', '#BuildingInPublic'];
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('saas')) hashtags.push('#SaaS');
  if (text.includes('ai') || text.includes('ml')) hashtags.push('#AI');
  if (text.includes('funding') || text.includes('investor')) hashtags.push('#Fundraising');
  if (text.includes('mvp') || text.includes('validate')) hashtags.push('#MVP');
  return hashtags.join(' ');
}

/**
 * Generates relevant hashtags.
 */
export function generateStartupHashtags(name, industry) {
  const cleanName = name.replace(/[\s\W-]+/g, '');
  const cleanInd = industry.replace(/[\s\W-]+/g, '');
  return `#FounderX #${cleanName} #${cleanInd} #StartupTraction`;
}

/**
 * Normalizes input text punctuation.
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .trim();
}

/**
 * Word count tokenization tool to enforce precise limits.
 */
function enforceTokenLimit(text, limit) {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(" ") + "... [Truncated for brevity]";
}

/**
 * Checks detailed roadmaps.
 */
function checkIsDetailedRequest(normalizedText) {
  const detailedPhrases = ['explain deeply', 'give full plan', 'step by step', 'detailed roadmap', 'complete guide', 'roadmap', 'deep plan'];
  return detailedPhrases.some(phrase => normalizedText.includes(phrase));
}

/**
 * Processes inputs and coordinates concise response rules.
 */
export function getAssistantResponse(inputMessage) {
  try {
    if (!inputMessage || typeof inputMessage !== 'string') {
      return {
        text: "Hi! I’m FounderX AI. I can help with startup ideas, business planning, investors, pitching, or using FounderX. What do you want to build today?",
        actions: [
          { label: 'Create Startup Profile', type: 'prompt', prompt: 'Create my startup profile' },
          { label: 'How does FounderX work?', type: 'prompt', prompt: 'Explain FounderX' },
          { label: 'How do I find investors?', type: 'prompt', prompt: 'How do I find investors?' }
        ]
      };
    }

    const normalized = normalizeText(inputMessage);

    // ================= PRIORITY 1 & 2 INTENT DETECTOR OVERRIDES =================
    
    // Quick Post Types (Startup Announcement, Product Launch, Hiring, Funding, Founder Story)
    const isLaunchPost = normalized.includes('product launch') || normalized.includes('launch post');
    const isAnnouncement = normalized.includes('announcement') || normalized.includes('milestone post');
    const isHiring = normalized.includes('hiring') || normalized.includes('join') || normalized.includes('team');
    const isFunding = normalized.includes('funding') || normalized.includes('seed round') || normalized.includes('raised') || normalized.includes('capital');
    const isStory = normalized.includes('story') || normalized.includes('behind the scenes') || normalized.includes('grit');
    const isGeneralPostGen = normalized.includes('create a post') || normalized.includes('create post') || normalized.includes('generate content') || normalized.includes('marketing post') || normalized.includes('ai post') || normalized.includes('generator');

    if (isLaunchPost || isAnnouncement || isHiring || isFunding || isStory || isGeneralPostGen) {
      let postType = 'General Announcement';
      let title = 'Startup Milestone Update';
      let description = 'We are excited to share a major milestone in our journey. Our founding team has been executing at high velocity to build scalable tech architectures and validate value loops with our early customers!';
      let hashtags = '#BuildingInPublic #Traction #FounderX';
      let cta = 'Check out our profile and follow our journey!';
      let concept = 'Futuristic high-velocity launching rocket overlaid with abstract digital grids.';

      if (isLaunchPost) {
        postType = 'Product Launch';
        title = ' Product Launch: Streamlining Founder Sprints!';
        description = 'The wait is over! We have officially deployed our new production platform designed to automate investor matching and founder metrics. Engineered with modern micro-animations, glassmorphic UI elements, and a blazing fast dashboard.';
        hashtags = '#ProductLaunch #TechInnovation #SaaS #FounderX';
        cta = 'Sign up for free and experience the platform today!';
        concept = 'Sleek dark-mode dashboard interface mockup displayed on a premium glassmorphic device screen.';
      } else if (isHiring) {
        postType = 'Hiring Post';
        title = ' We are Hiring: Join our founding developer team!';
        description = 'We are searching for an exceptional founding Software Engineer to help build and scale our next-gen platform. If you have deep expertise in modern React/Next.js, Node.js, and love building clean UIs with harmony color systems, let\'s execute!';
        hashtags = '#Hiring #StartupJobs #SoftwareEngineer #FounderX';
        cta = 'Send us a DM or apply directly on our FounderX Startup Page!';
        concept = 'Vibrant hiring announcement graphic with high-contrast bold modern typography.';
      } else if (isFunding) {
        postType = 'Funding Update';
        title = ' Funding Update: Securing Seed round to fuel growth!';
        description = 'Thrilled to announce that we have successfully secured our seed capital round. This funding allows us to accelerate product development, expand our core engineering team, and scale active user acquisitions. A huge thank you to our investors!';
        hashtags = '#Fundraising #VentureCapital #StartupFunding #Traction';
        cta = 'Read our full funding roadmap inside our Startup details!';
        concept = 'A confident founder presenting active growth trends on an interactive VC projector screen.';
      } else if (isStory) {
        postType = 'Founder Story';
        title = ' Founder Story: Building in Public and validated discovery';
        description = 'It started with a single frustration: co-founders losing hundreds of hours monthly to disjointed workflow tools. After conducting 40+ customer discovery interviews and launching multiple smoke-test waitlists, we validated real demand. Execution is our unfair advantage!';
        hashtags = '#FounderStory #Grit #BuildingInPublic #Mindset';
        cta = 'Connect with us to share startup sprints and collaborate!';
        concept = 'An intimate workspace view with team members gathered around whiteboard mockups.';
      } else if (isAnnouncement) {
        postType = 'Startup Announcement';
        title = ' Startup Announcement: Embarking on a new vision!';
        description = 'Excited to announce the official launch of our platform designed to help builders scale and find active capital partners. We are building in public to connect co-founders and accelerate startup growth globally.';
        hashtags = '#StartupAnnouncement #BuildingInPublic #FounderX #Velocity';
        cta = 'Follow our startup page to receive real-time execution updates!';
        concept = 'High-energy launch visual showing clean gradients and glowing startup network hubs.';
      }

      // If user typed a rough phrase, let's incorporate it!
      if (isGeneralPostGen && inputMessage.length > 15 && !inputMessage.includes('Generator') && !inputMessage.includes('generator')) {
        title = ' Milestone Update: ' + inputMessage.replace(/create a post|create post|generate content|marketing post/gi, '').trim();
        description = `Excited to announce a massive milestone: we just "${inputMessage.replace(/create a post|create post|generate content|marketing post/gi, '').trim()}"!\n\nThis represents a huge sprint for our founding team and brings us one step closer to accelerating startup growth. Thank you to everyone supporting us!`;
        concept = 'Beautiful abstract data dashboard demonstrating traction growth curves.';
      }

      return {
        text: ` **FounderX AI ${postType} Formulator**

I have formatted a premium, publishable startup milestone post based on your details. You can review, edit, schedule, or publish it live in one click below!

---START_AUTO_POST---
TITLE: ${title}
DESCRIPTION: ${description}
HASHTAGS: ${hashtags}
CTA: ${cta}
IMAGE_CONCEPT: ${concept}
---END_AUTO_POST---`,
        actions: [
          'Generate Investor Pitch',
          'Create Startup Announcement',
          'Create Product Launch Post',
          'Create Hiring Post',
          'Create Funding Update',
          'Create Founder Story'
        ]
      };
    }

    // 1. Create Startup Profile
    const createStartupKeywords = ['create my startup', 'create startup', 'add my startup', 'add startup', 'create startup profile', 'add my business idea', 'make a startup page', 'add startup page', 'create startup page', 'help me make a startup page'];
    if (createStartupKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'CREATE_STARTUP',
        text: " **FounderX AI Operator Activated**\n\nGreat choice! Let's build your professional **Startup Profile** on FounderX. I will guide you through this step-by-step to optimize your details for VCs.\n\nFirst, **what is your startup name?**",
        actions: ['Cancel']
      };
    }

    // 2. Create Startup Post (Existing Wizard)
    const createPostKeywords = ['create a post', 'create post', 'post update', 'publish post', 'post an update', 'write a post', 'post startup update'];
    if (createPostKeywords.some(kw => normalized.includes(kw)) && !normalized.includes('ai post') && !normalized.includes('generator')) {
      return {
        actionTrigger: 'CREATE_POST',
        text: " **FounderX AI Operator Activated**\n\nAwesome! Let's write and publish an engaging **Startup Update Post** to the global feed.\n\nFirst, **what is the title of your post?**",
        actions: ['Cancel']
      };
    }

    // 3. Edit Founder Profile
    const editProfileKeywords = ['edit profile', 'update profile', 'change bio', 'create founder bio', 'founder profile setup', 'update my profile'];
    if (editProfileKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'EDIT_PROFILE',
        text: " **FounderX AI Operator Activated**\n\nOutstanding! Let's optimize your **Founder Profile** details to make it highly attractive for connections.\n\nFirst, **what is your current role/job title?** (e.g. Founder & CEO, Lead Engineer)",
        actions: ['Cancel']
      };
    }

    // 4. Upload Pitch Presentation
    const uploadPitchKeywords = ['upload pitch deck', 'publish pitch deck', 'upload pitch', 'add pitch', 'publish pitch'];
    if (uploadPitchKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'UPLOAD_PITCH',
        text: " **FounderX AI Operator Activated**\n\nExcellent decision! Let's publish your **Pitch Presentation Deck** to your profile to capture investor attention.\n\nFirst, **what is the title of this pitch deck?** (e.g. Seed Overview, Pitch presentation)",
        actions: ['Cancel']
      };
    }

    // 5. Upload Vertical Video
    const uploadVideoKeywords = ['upload video', 'publish video', 'vertical pitch video', 'upload startup video', 'pitch video'];
    if (uploadVideoKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'UPLOAD_VIDEO',
        text: " **FounderX AI Operator Activated**\n\nSplendid! Startup vertical videos get **4.5x more click-throughs** on the Watch feed.\n\nFirst, **what is the title of your vertical watch video?** (e.g. 60-Second Elevate Pitch, Product Walkthrough)",
        actions: ['Cancel']
      };
    }

    // 6. AI Startup Plan Builder
    const createStartupPlanKeywords = ['create a startup plan', 'create startup plan', 'startup plan builder', 'generate startup plan', 'startup plan', 'business plan'];
    if (createStartupPlanKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'CREATE_STARTUP_PLAN',
        text: " **Startup Plan Builder**\nStep 1 of 6\n\nWhat is your **startup name**?",
        actions: ['Cancel']
      };
    }

    // 7. AI Pitch Generator
    const generatePitchKeywords = ['generate pitch', 'ai pitch generator', 'generate pitch deck', 'pitch generator', 'make pitch tagline', 'create elevator pitch', 'elevator pitch tagline'];
    if (generatePitchKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'GENERATE_PITCH',
        text: " **AI Pitch Generator**\nStep 1 of 5\n\nI will generate a premium Pitch Suite (Elevator pitch, Investor pitch outline, and One-line tagline).\n\nFirst, what is your **startup name**?",
        actions: ['Cancel']
      };
    }

    // 8. AI Investor Match Assistant
    const matchInvestorsKeywords = ['match investors', 'investor match', 'ai investor match', 'find matching investors', 'match investors assistant', 'investor match assistant'];
    if (matchInvestorsKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'MATCH_INVESTORS',
        text: " **AI Investor Match Assistant**\nStep 1 of 5\n\nI will recommend suitable investor types and match reasons based on your stage and funding needs.\n\nFirst, what is your **startup name**?",
        actions: ['Cancel']
      };
    }

    // 9. AI Founder Post Generator
    const generatePostKeywords = ['ai post generator', 'generate post', 'ai post', 'post generator'];
    if (generatePostKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'GENERATE_POST',
        text: " **AI Post Generator**\n\nI can convert a rough update or idea into a professional startup milestone post for the global Community Feed.\n\nFirst, **what is the rough idea or milestone update?** (e.g. 'we hit 10k users and launched a new referral code')",
        actions: ['Cancel']
      };
    }

    // 10. AI Investor Outreach Message
    const generateOutreachKeywords = ['investor outreach', 'generate outreach', 'outreach message', 'outreach generator', 'pitch outreach', 'investor message generator'];
    if (generateOutreachKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'GENERATE_OUTREACH',
        text: " **AI Investor Outreach Message**\nStep 1 of 3\n\nI will generate a high-conversion outreach message for pitching angels and VCs.\n\nFirst, what is the **name of the investor or VC fund** you are reaching out to?",
        actions: ['Cancel']
      };
    }

    // 11. AI Startup Score
    const startupScoreKeywords = ['startup score', 'ai startup score', 'calculate score', 'evaluate startup', 'startup scorecard', 'score my startup'];
    if (startupScoreKeywords.some(kw => normalized.includes(kw))) {
      return {
        actionTrigger: 'STARTUP_SCORE',
        text: " **AI Startup Score**\nStep 1 of 5\n\nI will evaluate your startup details and calculate a score out of 100 with actionable VC improvement tips.\n\nFirst, what is your **startup name**?",
        actions: ['Cancel']
      };
    }

    // ================= STANDARD CONVERSATION ENGINE =================

    // GREETINGS ROUTE
    const greetingKeywords = ['hi', 'hello', 'hey', 'greetings', 'yo', 'welcome', 'anyone there'];
    const isGreeting = greetingKeywords.some(kw => 
      normalized === kw || 
      normalized.startsWith(kw + ' ') || 
      normalized.endsWith(' ' + kw) ||
      normalized.includes(' ' + kw + ' ')
    );

    if (isGreeting) {
      const greetingText = "Hi! I’m FounderX AI. I can help with startup ideas, business planning, investors, pitching, or using FounderX. What do you want to build today?";
      return {
        text: enforceTokenLimit(greetingText, 60),
        actions: [
          'How do I find investors?',
          'How do I validate my idea?',
          'Create a startup plan',
          'Explain FounderX'
        ]
      };
    }

    // CASUAL CHAT CODES
    const casualMatches = {
      'confused': "No problem. Tell me your idea or problem in one line, and I’ll help you break it into clear next steps.",
      'stuck': "Being stuck is part of the process! Tell me what bottleneck you're facing (e.g. tech, MVP, user interest) and let's troubleshoot.",
      'lost': "Take a breath! Tell me your core startup concept in 1 sentence, and we'll outline the first 3 tasks to get you moving.",
      'thanks': "You are very welcome!  Keep executing, stay close to your customers, and let me know if you hit any other hurdles.",
      'thank you': "Happy to support! Accelerating your startup journey is what I'm here for. Go make something people want!",
      'how are you': "I am energized and ready to mentor! Tell me about your startup idea, or let's refine your pitching framework today.",
      'nice': "Outstanding! Action beats theory every single time. What is your next move?",
      'cool': "Execution is the key! Let me know if you want to validate an idea, build a plan, or reach investors.",
      'great': "Excellent! Keep that momentum high. What startup challenge shall we tackle next?"
    };

    for (const [kw, resp] of Object.entries(casualMatches)) {
      if (normalized.includes(kw)) {
        return {
          text: enforceTokenLimit(` **FounderX AI Mentor**\n\n${resp}`, 120),
          actions: [
            'Create a startup plan',
            'How do I validate my idea?',
            'Explain FounderX'
          ]
        };
      }
    }

    // ================= RESILIENT STEM-BASED KNOWLEDGE ROUTING =================
    let matchedCategoryKey = null;

    if (normalized.includes('invest') || normalized.includes('vc') || normalized.includes('angel') || normalized.includes('capital') || normalized.includes('funding')) {
      matchedCategoryKey = normalized.includes('find') || normalized.includes('connect') ? 'investors' : 'raise_funding';
    } else if (normalized.includes('validate') || normalized.includes('validation') || normalized.includes('prototype') || normalized.includes('smoke test')) {
      matchedCategoryKey = 'validation';
    } else if (normalized.includes('mvp') || normalized.includes('concept') || normalized.includes('blueprint') || normalized.includes('launch') || normalized.includes('startup plan')) {
      matchedCategoryKey = 'startup_plan';
    } else if (normalized.includes('pitch') || normalized.includes('deck') || normalized.includes('presentation')) {
      matchedCategoryKey = 'pitching';
    } else if (normalized.includes('cofounder') || normalized.includes('co-founder') || normalized.includes('partner') || normalized.includes('collaborator')) {
      matchedCategoryKey = 'cofounders';
    } else if (normalized.includes('saas') || normalized.includes('pricing') || normalized.includes('monetize') || normalized.includes('business model') || normalized.includes('revenue')) {
      matchedCategoryKey = 'business_model';
    } else if (normalized.includes('grow') || normalized.includes('marketing') || normalized.includes('sales') || normalized.includes('acquire') || normalized.includes('growth')) {
      matchedCategoryKey = 'marketing_sales';
    } else if (normalized.includes('legal') || normalized.includes('incorporate') || normalized.includes('vesting') || normalized.includes('c-corp') || normalized.includes('shares')) {
      matchedCategoryKey = 'legal_basics';
    } else if (normalized.includes('founderx') || normalized.includes('verify') || normalized.includes('badge') || normalized.includes('platform')) {
      matchedCategoryKey = 'explain_founderx';
    } else if (normalized.includes('mindset') || normalized.includes('grit') || normalized.includes('motivation') || normalized.includes('stress')) {
      matchedCategoryKey = 'mindset';
    }

    // FALLBACK TO WORD-OVERLAP MATCHING ONLY IF NO STRONG STEM MATCHED
    if (!matchedCategoryKey) {
      let maxScore = 0;
      const words = normalized.split(/\s+/);

      for (const [key, category] of Object.entries(MENTOR_DATA)) {
        let score = 0;
        
        category.keywords.forEach(keyword => {
          if (normalized.includes(keyword)) {
            score += keyword.split(' ').length * 3;
          }
        });

        words.forEach(word => {
          if (word.length > 2 && category.keywords.some(kw => kw.split(' ').includes(word))) {
            score += 1;
          }
        });

        if (score > maxScore) {
          maxScore = score;
          matchedCategoryKey = key;
        }
      }
    }

    const isDetailed = checkIsDetailedRequest(normalized);

    // SERVE MATCHED KNOWLEDGE BASE CATEGORIES
    if (matchedCategoryKey) {
      const category = MENTOR_DATA[matchedCategoryKey];

      if (isDetailed && category.detailed) {
        const detailedData = category.detailed;
        const textToReturn = ` **Detailed FounderX AI Roadmap**\n\n${detailedData.text}`;
        return {
          text: enforceTokenLimit(textToReturn, 700),
          actions: detailedData.actions || [],
          route: category.route || null
        };
      }

      const shortData = category.short;
      const formattedShortText = ` **FounderX AI Mentor**
      
**Problem:** ${shortData.problem}
**Best Move:** ${shortData.move}

**Next 3 Steps:**
1. ${shortData.steps[0]}
2. ${shortData.steps[1]}
3. ${shortData.steps[2]}

*Smart Mentor Question:* ${shortData.question}`;

      const defaultActions = [
        'explain deeply',
        'How do I validate my idea?',
        'Best business model for my idea'
      ];

      return {
        text: enforceTokenLimit(formattedShortText, 250),
        actions: defaultActions,
        route: category.route || null
      };
    }

    // ================= DYNAMIC GENERAL BUSINESS MENTOR ENGINE =================
    const isBusiness = BUSINESS_DOMAIN_TERMS.some(term => normalized.includes(term)) || 
                       normalized.includes('how to') || 
                       normalized.includes('what is') || 
                       normalized.includes('why does') ||
                       normalized.includes('how can') ||
                       normalized.includes('tips for') ||
                       normalized.includes('guide to');

    if (isBusiness) {
      const subject = extractBusinessSubject(normalized);
      
      let problem = `Scaling or optimizing **${subject}** without continuous customer validation and testing limits startup traction.`;
      let move = `Map the assumptions regarding **${subject}**, find key performance indicators, and ship the leanest iteration in 48 hours.`;
      let steps = [
        `Interview 2-3 target customers or industry peers specifically about their frustrations with **${subject}**.`,
        `Outline 1 immediate execution sprint to test demand or resolve constraints.`,
        `Leverage the **FounderX Feed (/feed)** to post details or questions, connecting with active founders who have optimized this.`
      ];
      let question = `What is the main bottleneck you are experiencing with **${subject}** right now?`;

      // DOMAIN SUB-TEMPLATES
      const cleanSubj = subject.toLowerCase();
      if (cleanSubj.includes('seo') || cleanSubj.includes('marketing') || cleanSubj.includes('pr') || cleanSubj.includes('traffic') || cleanSubj.includes('brand') || cleanSubj.includes('ads') || cleanSubj.includes('growth')) {
        problem = `Driving awareness for **${subject}** with expensive paid ads before establishing organic traction or high-converting pages drains startup runway.`;
        move = `Build a high-impact organic hook, optimize your landing page conversion path, and utilize public relations or SEO content loops.`;
        steps = [
          `Draft 3 pieces of highly educational content addressing the exact pains of your target audience.`,
          `Optimize your site metadata, load speed, and structure a single clear Call-to-Action (CTA).`,
          `Interact with 5 relevant community discussions daily (e.g. on Reddit, Twitter, or FounderX Feed) providing genuine value.`
        ];
        question = `What specific demographic are you trying to reach with your **${subject}** campaigns?`;
      } else if (cleanSubj.includes('funding') || cleanSubj.includes('invest') || cleanSubj.includes('equity') || cleanSubj.includes('cap table') || cleanSubj.includes('valuation') || cleanSubj.includes('shares') || cleanSubj.includes('vc') || cleanSubj.includes('angel')) {
        problem = `Pitching for **${subject}** without verified traction, clean incorporation documents, or market size proof results in quick VC rejections.`;
        move = `Construct a watertight pitch deck, clean up early cap tables, and target stage-appropriate angel networks rather than large VC funds.`;
        steps = [
          `Synthesize your current traction metrics (e.g. MRR growth, user waitlist size) into a single high-impact slide.`,
          `List 20-30 active angels or micro-VCs on FounderX who have backed similar sectors.`,
          `Send highly concise direct outreach (under 150 words) requesting a 10-minute feedback chat.`
        ];
        question = `How much capital are you planning to raise for **${subject}**, and what is your runway status?`;
      } else if (cleanSubj.includes('legal') || cleanSubj.includes('incorporat') || cleanSubj.includes('vesting') || cleanSubj.includes('contract') || cleanSubj.includes('agreement') || cleanSubj.includes('corp')) {
        problem = `Rushing into legal setups or splitting equity evenly without vesting schedules causes severe founder conflict down the road.`;
        move = `Form a Delaware C-Corp for professional investor compatibility and implement a standard 4-year vesting plan with a 1-year cliff.`;
        steps = [
          `Draft a formal founder agreement outlining roles, time commitments, and intellectual property transfers.`,
          `Incorporate via a reliable, automated platform to establish a clean and standard corporate layout.`,
          `Setup a standard vesting schedule of 48 months with a 12-month cliff to safeguard all partners' interests.`
        ];
        question = `Do you have co-founders on this project, or are you currently operating as a solo founder?`;
      } else if (cleanSubj.includes('hiring') || cleanSubj.includes('recruit') || cleanSubj.includes('team') || cleanSubj.includes('partner') || cleanSubj.includes('skills') || cleanSubj.includes('employ')) {
        problem = `Hiring expensive full-time employees too early or partner-matching without execution trials strains cash flow and causes early friction.`;
        move = `Run a 2-week trial sprint on a mini-project before onboarding partners, and hire flexible contractors before full-time staff.`;
        steps = [
          `Map out the exact technical or commercial skill gap you need to fill in your early team.`,
          `Filter collaborators on the FounderX Community by specific skillsets and check their feed insights.`,
          `Propose a micro-milestone project with a small budget or trial equity to test collaborative chemistry.`
        ];
        question = `Are you looking for technical partners (developers) or commercial business operators?`;
      } else if (cleanSubj.includes('product') || cleanSubj.includes('mvp') || cleanSubj.includes('design') || cleanSubj.includes('feature') || cleanSubj.includes('code') || cleanSubj.includes('tech') || cleanSubj.includes('prototype')) {
        problem = `Over-engineering your **${subject}** with too many features before launching causes delayed market feedback and wasted developer spend.`;
        move = `Scope down your product to a single core value proposition (MVP) and get it in front of users as quickly as possible.`;
        steps = [
          `List all planned features and aggressively cut everything except the one single utility users need most.`,
          `Build a high-fidelity prototype or waitlist landing page to gauge initial click-through commitment.`,
          `Deploy your MVP to 10 early users within a 2-week execution sprint to observe real-world usage.`
        ];
        question = `What is the single most critical problem that your **${subject}** solves for your user?`;
      } else if (cleanSubj.includes('saas') || cleanSubj.includes('pricing') || cleanSubj.includes('monetiz') || cleanSubj.includes('revenue') || cleanSubj.includes('cost') || cleanSubj.includes('price')) {
        problem = `Underpricing your **${subject}** or adopting a complex monetization model confuses customers and damages perceived value.`;
        move = `Align pricing with the concrete value or cost savings your user receives, and start with simple subscription tiers.`;
        steps = [
          `Research competitor pricing structures to establish an industry-standard baseline for **${subject}**.`,
          `Offer a clean three-tiered pricing model (e.g. Free/Hobby, Professional, Enterprise) to capture different budgets.`,
          `Conduct interviews with early adopters specifically asking what pricing triggers their purchasing decision.`
        ];
        question = `Who is your primary customer (B2B business or B2C consumer) for this **${subject}**?`;
      }

      const dynamicText = ` **FounderX AI Mentor**

**Problem:** ${problem}
**Best Move:** ${move}

**Next 3 Steps:**
1. ${steps[0]}
2. ${steps[1]}
3. ${steps[2]}

*Smart Mentor Question:* ${question}`;

      return {
        text: enforceTokenLimit(dynamicText, 250),
        actions: [
          'Create a startup plan',
          'How do I validate my idea?',
          'Explain FounderX'
        ]
      };
    }

    // GENERAL CONCISE RESILIENT FALLBACK
    const shortFallback = ` **FounderX AI Mentor**

**Problem:** Operating startup building or platform features without a structured action sequence causes wasted effort.
**Best Move:** Outline the single biggest assumption you are making and test it within the next 48 hours.

**Next 3 Steps:**
1. Tell me your startup concept in 1 sentence to define its value prop.
2. Complete your **FounderX Profile** to signal early adopters and investors.
3. Share your progress update or question on the **FounderX Feed** for peer reviews.

*Smart Mentor Question:* What is the main barrier slowing your startup down today?`;

    return {
      text: enforceTokenLimit(shortFallback, 250),
      actions: [
        'How do I validate my idea?',
        'Create a startup plan',
        'Explain FounderX'
      ]
    };
  } catch (err) {
    console.error("AI Assistant Matching caught runtime breakdown:", err);
    return {
      text: " **FounderX AI Operator**\n\nI experienced a minor latency. Tell me your startup question or concept, and let's build your next steps!",
      actions: ['Create Startup Profile', 'Explain FounderX']
    };
  }
}
