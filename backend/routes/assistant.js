const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Models
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Startup = require('../models/Startup');
const Application = require('../models/Application');
const InvestmentRequest = require('../models/InvestmentRequest');

// Utils
const calculateFounderScore = require('../utils/calculateFounderScore');
const { createNotification } = require('../utils/socialHelpers');

// Auth middleware
const { protect, optionalProtect } = require('../middleware/auth');

// RAG Services
const aiRouter = require('../services/aiRouter');
const retrievalService = require('../services/retrievalService');
const ragSecurity = require('../middleware/ragSecurity');
const ragService = require('../services/ragService');
const groqService = require('../services/groqService');

// ──────────────────────────────────────────────────────────────────────
// Multer setup for voice + file uploads inside chatbot
// ──────────────────────────────────────────────────────────────────────
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB (Whisper limit)
  fileFilter: (req, file, cb) => {
    // Accept audio, images, and common document types
    const allowed = /audio|image|video|application\/pdf|text\/plain|application\/msword|application\/vnd\./;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// ──────────────────────────────────────────────────────────────────────
// Groq API Helper Utilities
// ──────────────────────────────────────────────────────────────────────
const GROQ_BASE = 'https://api.groq.com/openai/v1';

function isGroqConfigured() {
  return !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10);
}

function groqHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
  };
}

/**
 * One-shot text generation (no history).
 */
async function generateText(prompt, opts = {}) {
  const res = await axios.post(`${GROQ_BASE}/chat/completions`, {
    model: opts.model || 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.max_tokens ?? 800
  }, { headers: groqHeaders() });
  return res.data.choices[0].message.content;
}

/**
 * Multi-turn chat with a system prompt and prior history.
 */
async function chatWithHistory(systemPrompt, history, userMessage) {
  const messages = [{ role: 'system', content: systemPrompt }];
  for (const h of history) {
    messages.push({ role: h.role, content: h.text });
  }
  messages.push({ role: 'user', content: userMessage });

  const res = await axios.post(`${GROQ_BASE}/chat/completions`, {
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 800
  }, { headers: groqHeaders() });
  return res.data.choices[0].message.content;
}

/**
 * Transcribe audio buffer using Groq Whisper API.
 */
async function transcribeAudio(buffer, mimetype, originalname, language = 'en-IN') {
  const formData = new FormData();
  const ext = (originalname || 'audio.webm').split('.').pop() || 'webm';
  formData.append('file', buffer, { filename: `voice.${ext}`, contentType: mimetype });
  formData.append('model', 'whisper-large-v3');
  const langCode = (language || 'en').split('-')[0];
  formData.append('language', langCode);

  const res = await axios.post(`${GROQ_BASE}/audio/transcriptions`, formData, {
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  return res.data.text || '';
}

/**
 * Describe an uploaded image via Groq vision model.
 */
async function describeImage(buffer, mimetype) {
  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64}`;

  const res = await axios.post(`${GROQ_BASE}/chat/completions`, {
    model: 'llama-3.2-11b-vision-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image briefly in 1-2 sentences for context in a startup platform chatbot.' },
        { type: 'image_url', image_url: { url: dataUri } }
      ]
    }],
    temperature: 0.3,
    max_tokens: 200
  }, { headers: groqHeaders() });
  return res.data.choices[0].message.content;
}

/**
 * Robustly parse JSON from an LLM response that may include markdown fencing.
 */
function parseJsonFromText(text) {
  // Strip markdown fences
  let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  // Find first { to last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

// ──────────────────────────────────────────────────────────────────────
// Session Memory (in-process — persists across requests for same PID)
// ──────────────────────────────────────────────────────────────────────
const MAX_HISTORY_TURNS = 20;
const sessionHistories = new Map(); // Map<userId, { role, text }[]>
const pendingActions = new Map();   // Map<userId, { action, payload, timestamp }>

// Evict stale pending actions every 60 s
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of pendingActions) {
    if (now - entry.timestamp > 5 * 60 * 1000) {
      pendingActions.delete(userId);
    }
  }
}, 60_000);

function getHistory(userId) {
  if (!sessionHistories.has(userId)) sessionHistories.set(userId, []);
  return sessionHistories.get(userId);
}

function pushHistory(userId, role, text) {
  const h = getHistory(userId);
  h.push({ role, text });
  if (h.length > MAX_HISTORY_TURNS * 2) {
    h.splice(0, h.length - MAX_HISTORY_TURNS * 2);
  }
}

// ──────────────────────────────────────────────────────────────────────
// Save uploaded file locally (reuses pattern from upload.js)
// ──────────────────────────────────────────────────────────────────────
function saveFileLocally(req, file) {
  const publicDir = path.join(__dirname, '../public');
  const uploadDir = path.join(publicDir, 'uploads');
  const sub = file.mimetype.startsWith('video/') ? 'videos'
            : file.mimetype.startsWith('audio/') ? 'audio'
            : 'images';
  const typeDir = path.join(uploadDir, sub);

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(typeDir))   fs.mkdirSync(typeDir, { recursive: true });

  const timestamp = Date.now();
  const host = req.get('host') || 'localhost:5001';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const cleanName = (file.originalname || 'file').replace(/[^a-zA-Z0-9.]/g, '_');
  const filename = `chat_${timestamp}_${cleanName}`;
  fs.writeFileSync(path.join(typeDir, filename), file.buffer);

  return `${protocol}://${host}/public/uploads/${sub}/${filename}`;
}

// ──────────────────────────────────────────────────────────────────────
// FounderX System Prompt
// ──────────────────────────────────────────────────────────────────────
function buildSystemPrompt(user, language = 'en-IN') {
  const isInvestor = user && user.role === 'investor';
  const roleName = isInvestor ? 'Investor' : 'Founder';

  const languageNames = {
    'hi-IN': 'Hindi (हिंदी)',
    'te-IN': 'Telugu (తెలుగు)',
    'ta-IN': 'Tamil (தமிழ்)',
    'kn-IN': 'Kannada (ಕನ್ನಡ)',
    'mr-IN': 'Marathi (मराठी)',
    'bn-IN': 'Bengali (বাংলা)',
    'en-IN': 'English',
    'en-US': 'English'
  };
  const langName = languageNames[language] || 'English';

  return `You are FounderX AI, an elite startup companion and platform operator talking to a ${roleName}.

IMPORTANT: You MUST write your conversational responses in ${langName}. Respond naturally and write/speak directly in ${langName}. All replies must be strictly written in ${langName}.

Your core capabilities:
${isInvestor ? `
1. Help the investor discover promising startups and express investment interest.
2. Help review and manage incoming pitch decks and startup applications.
3. Provide concise market insights and due-diligence guidance.
4. Accept or reject investment requests on behalf of startups they are associated with.` : `
1. Help the founder manage their startup profile, post milestone updates, and check their Founder Score.
2. Help them find investors and submit investment requests.
3. Help them accept or reject job/internship applications and investment requests for their startups.
4. Help them craft compelling posts, pitches, and announcements.
5. Guide them to the right sections of the FounderX platform.`}

**FounderX Platform Navigation:**
- Community Feed: "/" — share milestones, news, pitches
- Investors Portal: "/investors" — match with stage-appropriate VCs & angels
- Pitch Watch Feed: "/watch" — 60-second elevator video pitches
- Startup Directory: "/startups" — explore and create startup pages
- Direct Inbox: "/messages" — DM collaborators, peers, investors
- Founder Profile: "/profile" — credentials, bios, pitch assets

**AI Operator Commands** (remind users they can say these):
- "Check my founder score"
- "Create a post about [milestone]"
- "Search startups in [industry]"
- "Invest in [startup name]"
- "Update my bio: [new bio text]"
- "Analyze my startup"
- "Accept/Reject application [id]"
- "Accept/Reject investment request [id]"

When the user uploads an image, help them use it for a post, startup logo, or profile update.
When the user sends a voice message, treat the transcribed text as their input.

RULES:
- Keep normal chat replies to 3-5 short lines MAX. Be concise and punchy.
- When creating posts, use the structured ---START_AUTO_POST--- / ---END_AUTO_POST--- format.
- If user just says hi/hello, reply briefly about what you can help with.
- Be professional, energetic, and encouraging.
- Never fabricate data about the user's startup—always use real DB data when available.`;
}

// ──────────────────────────────────────────────────────────────────────
// AI Router Prompt
// ──────────────────────────────────────────────────────────────────────
function buildRouterPrompt(userInput, context) {
  return `Classify the user message into exactly one action and extract data.
User message: "${userInput}"
Known context: ${JSON.stringify(context)}

Return JSON only:
{
  "action": "chat" | "founder_score_check" | "create_post" | "search_startups" | "request_investment" | "update_profile" | "startup_feedback" | "accept_reject_application" | "accept_reject_investment",
  "payload": {
    "post_content": string | null,
    "startup_name": string | null,
    "industry": string | null,
    "bio": string | null,
    "headline": string | null,
    "story": string | null,
    "application_id": string | null,
    "investment_request_id": string | null,
    "operation": "accept" | "reject" | null,
    "message": string | null
  }
}`;
}

// ──────────────────────────────────────────────────────────────────────
// Keyword-based Fallback Router
// ──────────────────────────────────────────────────────────────────────
function getFallbackRoute(userInput, context) {
  const input = String(userInput || '').toLowerCase();

  // Founder Score
  if (/founder\s*score|check\s*(?:my\s*)?score|my\s*score|profile\s*score/.test(input)) {
    return { action: 'founder_score_check', payload: {} };
  }

  // Create post / milestone
  if (/create\s+(?:a\s+)?post|write\s+(?:a\s+)?post|post\s+(?:about|update)|milestone\s+post|announcement/.test(input)) {
    return { action: 'create_post', payload: { post_content: userInput } };
  }

  // Search startups
  if (/search\s+startups?|find\s+startups?|startups?\s+in\s+/.test(input)) {
    const industryMatch = input.match(/(?:in|for)\s+([a-zA-Z\/\s]+?)(?:\s+industry|\s+sector|$)/i);
    return { action: 'search_startups', payload: { industry: industryMatch ? industryMatch[1].trim() : null, startup_name: null } };
  }

  // Request investment
  if (/invest\s+in|request\s+investment|express\s+interest|want\s+to\s+invest/.test(input)) {
    const nameMatch = input.match(/(?:invest\s+in|interest\s+in)\s+(.+?)(?:\s+startup|\s*$)/i);
    return { action: 'request_investment', payload: { startup_name: nameMatch ? nameMatch[1].trim() : null, message: userInput } };
  }

  // Update profile
  if (/update\s+(?:my\s+)?(?:bio|headline|story|profile)|set\s+(?:my\s+)?(?:bio|headline|story)/.test(input)) {
    const bioMatch = input.match(/(?:bio|headline|story)[:\s]+(.+)/i);
    const field = /headline/i.test(input) ? 'headline' : /story/i.test(input) ? 'story' : 'bio';
    const payload = { [field]: bioMatch ? bioMatch[1].trim() : null };
    return { action: 'update_profile', payload };
  }

  // Startup feedback / analysis
  if (/analyze\s+(?:my\s+)?startup|startup\s+feedback|review\s+(?:my\s+)?startup|startup\s+analysis|pitch\s+feedback/.test(input)) {
    return { action: 'startup_feedback', payload: {} };
  }

  // Accept/Reject application
  if (/(?:accept|reject|approve|decline)\s+application/.test(input)) {
    const idMatch = input.match(/\b[a-f0-9]{24}\b/i);
    const op = /reject|decline/i.test(input) ? 'reject' : 'accept';
    return { action: 'accept_reject_application', payload: { application_id: idMatch ? idMatch[0] : null, operation: op } };
  }

  // Accept/Reject investment request
  if (/(?:accept|reject|approve|decline)\s+investment/.test(input)) {
    const idMatch = input.match(/\b[a-f0-9]{24}\b/i);
    const op = /reject|decline/i.test(input) ? 'reject' : 'accept';
    return { action: 'accept_reject_investment', payload: { investment_request_id: idMatch ? idMatch[0] : null, operation: op } };
  }

  return { action: 'chat', payload: {} };
}

// ──────────────────────────────────────────────────────────────────────
// Fallback Chat Responses (when Groq is down)
// ──────────────────────────────────────────────────────────────────────
function getFallbackChatResponse(userInput) {
  const input = String(userInput || '').toLowerCase().trim();

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(input)) {
    return '👋 Hey there! I\'m FounderX AI — I can check your Founder Score, create posts, search startups, help with investments, or analyze your startup profile. What would you like to do?';
  }
  if (/score/.test(input)) return 'Say **"check my founder score"** and I\'ll calculate it from your profile and activity!';
  if (/post/.test(input)) return 'Say **"create a post about [your milestone]"** and I\'ll craft a premium announcement for you!';
  if (/startup/.test(input)) return 'Say **"search startups in [industry]"** or **"analyze my startup"** and I\'ll help you out!';
  if (/invest/.test(input)) return 'Say **"invest in [startup name]"** and I\'ll help you express interest!';
  if (/profile|bio/.test(input)) return 'Say **"update my bio: [your new bio]"** and I\'ll update your profile instantly.';

  return 'I can help you **check your Founder Score**, **create milestone posts**, **search startups**, **express investment interest**, **update your profile**, or **analyze your startup**. Just tell me what you need! 🚀';
}

// ──────────────────────────────────────────────────────────────────────
// ACTION HANDLERS
// ──────────────────────────────────────────────────────────────────────

/**
 * Founder Score Check — calculates score + tips from DB data.
 */
async function handleFounderScoreCheck(userId) {
  const user = await User.findById(userId);
  if (!user) return { type: 'error', content: 'Could not find your account. Please make sure you are logged in.' };

  const postsCount = await Post.countDocuments({ authorId: userId });
  const commentsCount = await Comment.countDocuments({ userId });
  const responseRate = 85; // placeholder

  const { score, tips } = calculateFounderScore(user, { postsCount, commentsCount, responseRate });

  // Update in DB
  if (user.founderScore !== score) {
    user.founderScore = score;
    await user.save({ validateBeforeSave: false });
  }

  let content = `🏆 **Your Founder Score: ${score}/100**\n\n`;
  if (tips.length > 0) {
    content += `📈 **Tips to improve:**\n`;
    tips.forEach(t => { content += `• ${t}\n`; });
  } else {
    content += '🎉 Your profile is in great shape! Keep building and posting.';
  }
  content += `\n📊 Activity: ${postsCount} posts, ${commentsCount} comments`;

  return { type: 'founder_score', content, data: { score, tips, postsCount, commentsCount } };
}

/**
 * Create Post — generates a structured milestone post via AI.
 */
async function handleCreatePost(userId, payload, userInput) {
  const user = await User.findById(userId);
  const startup = await Startup.findOne({ founderId: userId });

  const postIdea = payload.post_content || userInput;
  const startupContext = startup
    ? `User's startup: "${startup.name}" — ${startup.oneLinePitch} (${startup.industry}, stage: ${startup.stage})`
    : 'User has not created a startup page yet.';

  if (!isGroqConfigured()) {
    return {
      type: 'create_post',
      content: `I'd love to help create a post, but the AI service is temporarily unavailable. You can head to the **Community Feed (/)** to create one manually!\n\nYour idea: "${postIdea}"`,
    };
  }

  const prompt = `You are FounderX AI Content Assistant. A founder wants to create a post.
${startupContext}
Founder name: ${user ? user.name : 'Unknown'}

Their idea/input: "${postIdea}"

Generate a premium milestone update in this EXACT format:

---START_AUTO_POST---
TITLE: [A professional, punchy headline]
DESCRIPTION: [A compelling, traction-focused startup description. Rewrite rough text into a premium B2B-engaging post.]
HASHTAGS: [3-4 startup-focused hashtags, e.g. #BuildingInPublic #Traction #FounderX]
CTA: [A clear call-to-action for investors, customers, or co-founders]
IMAGE_CONCEPT: [A suggested image concept matching the post]
---END_AUTO_POST---

Precede the block with a 1-2 sentence intro. Keep everything concise.`;

  const aiReply = await generateText(prompt, { temperature: 0.7 });
  return { type: 'create_post', content: aiReply };
}

/**
 * Search Startups — queries the DB for startups by name/industry.
 */
async function handleSearchStartups(payload) {
  const query = {};
  if (payload.startup_name) {
    query.name = { $regex: payload.startup_name, $options: 'i' };
  }
  if (payload.industry) {
    // Try matching against known enum values
    const industries = ['Technology','Healthcare','Finance','Education','E-commerce','SaaS','AI/ML','Blockchain','CleanTech','FoodTech','Fashion','Real Estate','Transportation','Other'];
    const matched = industries.find(i => i.toLowerCase().includes(payload.industry.toLowerCase()));
    if (matched) query.industry = matched;
    else query.industry = { $regex: payload.industry, $options: 'i' };
  }

  const startups = await Startup.find(query)
    .populate('founderId', 'name profileImage')
    .sort('-createdAt')
    .limit(5);

  if (startups.length === 0) {
    return { type: 'search_results', content: `No startups found matching your search. Try a different industry or name, or browse the **Startup Directory (/startups)**.`, data: [] };
  }

  let content = `🔍 **Found ${startups.length} startup${startups.length > 1 ? 's' : ''}:**\n\n`;
  startups.forEach((s, i) => {
    content += `**${i + 1}. ${s.name}** — ${s.oneLinePitch}\n`;
    content += `   🏷️ ${s.industry} · 📊 ${s.stage} · 👥 ${s.teamMembers.length + 1} members\n`;
    if (s.founderId) content += `   👤 Founded by ${s.founderId.name}\n`;
    content += `   🆔 ID: \`${s._id}\`\n\n`;
  });
  content += `💡 Say **"invest in [startup name]"** to express interest!`;

  return { type: 'search_results', content, data: startups.map(s => ({ _id: s._id, name: s.name, industry: s.industry, stage: s.stage, oneLinePitch: s.oneLinePitch, logo: s.logo, followerCount: s.followerCount })) };
}

/**
 * Request Investment — express interest in a startup.
 */
async function handleRequestInvestment(userId, payload) {
  if (!userId) return { type: 'missing_information', content: 'Please log in to express investment interest.' };

  let startup = null;
  if (payload.startup_name) {
    startup = await Startup.findOne({ name: { $regex: payload.startup_name, $options: 'i' } });
  }
  if (!startup && payload.startup_id) {
    startup = await Startup.findById(payload.startup_id);
  }
  if (!startup) {
    return {
      type: 'missing_information',
      content: `I couldn't find a startup named "${payload.startup_name || '(not specified)'}". Please search for startups first by saying **"search startups in [industry]"** and then try again with the exact name.`
    };
  }

  // Check if already requested
  const existing = await InvestmentRequest.findOne({ startupId: startup._id, investorId: userId });
  if (existing) {
    return { type: 'duplicate', content: `You've already expressed interest in **${startup.name}**! Current status: **${existing.status}**. Check your notifications for updates.` };
  }

  const request = await InvestmentRequest.create({
    startupId: startup._id,
    investorId: userId,
    founderId: startup.founderId,
    message: payload.message || `Investment interest expressed via FounderX AI`,
    requestPitchDeck: true
  });

  return {
    type: 'investment_requested',
    content: `✅ **Investment interest submitted!**\n\n🏢 Startup: **${startup.name}**\n📋 Status: Pending\n📩 The founder will be notified.\n\nYou can track this in your **Dashboard**.`,
    data: { requestId: request._id, startupName: startup.name }
  };
}

/**
 * Update Profile — update bio/headline/story directly from chat.
 */
async function handleUpdateProfile(userId, payload) {
  if (!userId) return { type: 'missing_information', content: 'Please log in to update your profile.' };

  const updateFields = {};
  if (payload.bio) updateFields.bio = payload.bio;
  if (payload.headline) updateFields.headline = payload.headline;
  if (payload.story) updateFields.story = payload.story;

  if (Object.keys(updateFields).length === 0) {
    return { type: 'missing_information', content: 'Please specify what you want to update. Example: **"update my bio: I build AI tools for founders"**' };
  }

  const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
  if (!user) return { type: 'error', content: 'Could not find your account to update.' };

  const fields = Object.keys(updateFields).join(', ');
  return {
    type: 'profile_updated',
    content: `✅ Your **${fields}** has been updated!\n\n${Object.entries(updateFields).map(([k, v]) => `**${k}**: ${v}`).join('\n')}\n\nView your profile at **/profile**.`,
    data: updateFields
  };
}

/**
 * Startup Feedback — AI analysis of the user's startup profile.
 */
async function handleStartupFeedback(userId) {
  if (!userId) return { type: 'missing_information', content: 'Please log in so I can analyze your startup.' };

  const startup = await Startup.findOne({ founderId: userId }).populate('founderId', 'name');
  if (!startup) {
    return { type: 'not_found', content: 'You haven\'t created a startup page yet! Head to **/startups** to create one, or say **"help me create my startup"**.' };
  }

  if (!isGroqConfigured()) {
    return {
      type: 'startup_feedback',
      content: `Here's your startup summary:\n\n🏢 **${startup.name}**\n💬 ${startup.oneLinePitch}\n🏷️ ${startup.industry} · ${startup.stage}\n💰 Funding needed: $${(startup.fundingRequired || 0).toLocaleString()}\n📊 Equity offered: ${startup.equityOffered || 0}%\n👥 Team: ${startup.teamMembers.length + 1} members\n📈 Milestones: ${(startup.milestones || []).length}\n\nAI analysis is temporarily unavailable. Check back soon!`
    };
  }

  const prompt = `Analyze this startup profile for investor-readiness. Be concise (bullet points, max 200 words).

Startup: ${startup.name}
One-line pitch: ${startup.oneLinePitch}
Description: ${startup.description}
Industry: ${startup.industry}
Stage: ${startup.stage}
Problem: ${startup.problem || 'Not specified'}
Solution: ${startup.solution || 'Not specified'}
Funding required: $${(startup.fundingRequired || 0).toLocaleString()}
Equity offered: ${startup.equityOffered || 0}%
Team size: ${startup.teamMembers.length + 1}
Tech stack: ${(startup.techStack || []).join(', ') || 'Not specified'}
Milestones: ${(startup.milestones || []).length}
Website: ${startup.website || 'None'}

Provide:
1. Overall readiness score (1-10)
2. Top 3 strengths
3. Top 3 areas to improve
4. One actionable next step`;

  const analysis = await generateText(prompt, { temperature: 0.5 });

  return {
    type: 'startup_feedback',
    content: `🔍 **Startup Analysis: ${startup.name}**\n\n${analysis}`,
    data: { startupId: startup._id, startupName: startup.name }
  };
}

/**
 * Accept/Reject Application — founder manages job/collaboration apps.
 */
async function handleApplicationUpdate(userId, payload) {
  if (!userId) return { type: 'missing_information', content: 'Please log in to manage applications.' };
  if (!payload.application_id) return { type: 'missing_information', content: 'Please provide the application ID. You can find it in your startup dashboard.' };

  const application = await Application.findById(payload.application_id).populate('applicantId', 'name');
  if (!application) return { type: 'not_found', content: `Application with ID \`${payload.application_id}\` not found.` };

  const startup = await Startup.findById(application.startupId);
  if (!startup || startup.founderId.toString() !== userId) {
    return { type: 'unauthorized', content: 'You are not authorized to manage this application.' };
  }

  const newStatus = payload.operation === 'reject' ? 'rejected' : 'accepted';
  application.status = newStatus;
  await application.save();

  const applicantName = application.applicantId ? application.applicantId.name : 'Unknown';
  const emoji = newStatus === 'accepted' ? '✅' : '❌';

  return {
    type: 'application_updated',
    content: `${emoji} Application from **${applicantName}** has been **${newStatus}**.\n\n📋 Type: ${application.type}\n🏢 Startup: ${startup.name}`,
    data: { applicationId: application._id, status: newStatus }
  };
}

/**
 * Accept/Reject Investment Request — founder manages investor interest.
 */
async function handleInvestmentRequestUpdate(userId, payload) {
  if (!userId) return { type: 'missing_information', content: 'Please log in to manage investment requests.' };
  if (!payload.investment_request_id) return { type: 'missing_information', content: 'Please provide the investment request ID. You can find it in your startup dashboard.' };

  const request = await InvestmentRequest.findById(payload.investment_request_id).populate('investorId', 'name');
  if (!request) return { type: 'not_found', content: `Investment request with ID \`${payload.investment_request_id}\` not found.` };

  const startup = await Startup.findById(request.startupId);
  if (!startup || startup.founderId.toString() !== userId) {
    return { type: 'unauthorized', content: 'You are not authorized to manage this investment request.' };
  }

  const newStatus = payload.operation === 'reject' ? 'declined' : 'accepted';
  request.status = newStatus;
  await request.save();

  const investorName = request.investorId ? request.investorId.name : 'Unknown';
  const emoji = newStatus === 'accepted' ? '✅' : '❌';

  return {
    type: 'investment_request_updated',
    content: `${emoji} Investment request from **${investorName}** has been **${newStatus}**.\n\n🏢 Startup: ${startup.name}\n💰 The investor will be notified.`,
    data: { requestId: request._id, status: newStatus }
  };
}

// ──────────────────────────────────────────────────────────────────────
// MAIN CHAT ENDPOINT
// ──────────────────────────────────────────────────────────────────────
router.post('/chat', optionalProtect, chatUpload.single('file'), async (req, res) => {
  try {
    const userId = req.user ? req.user._id.toString() : 'anonymous';
    const userRole = req.user ? req.user.role : 'founder';
    const userLanguage = req.body.language || 'en-IN';
    let userPrompt = req.body.userPrompt || req.body.message || '';
    const messagesRaw = req.body.messages;
    let messages = [];
    if (messagesRaw) {
      try { messages = typeof messagesRaw === 'string' ? JSON.parse(messagesRaw) : messagesRaw; } catch (e) { /* ignore parse errors */ }
    }

    let fileUrl = null;
    let fileType = null;
    let fileContext = '';

    // ── Handle uploaded file ──
    if (req.file) {
      const file = req.file;

      // PDF, DOCX, TXT document uploader RAG interception
      if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'text/plain' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.pdf') ||
        file.originalname.endsWith('.docx') ||
        file.originalname.endsWith('.txt')
      ) {
        if (userId === 'anonymous') {
          return res.status(200).json({
            success: true,
            text: 'Please log in to upload and index documents in the chat.',
            type: 'chat_response'
          });
        }
        try {
          console.log(`Indexing document uploaded via chatbot: ${file.originalname}`);
          const host = req.get('host');
          const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
          
          // Ingest/Index document in Pinecone
          const doc = await ragService.ingestDocument({
            fileBuffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            ownerId: req.user._id,
            sourceType: 'document',
            visibility: 'private',
            host,
            protocol
          });

          // Extract text for immediate LLM context
          const extractedText = await ragService.extractText(file.buffer, file.mimetype);
          const previewText = extractedText ? extractedText.substring(0, 15000) : '';
          fileContext = `[User uploaded a document named "${file.originalname}"]. Extracted text content:\n${previewText}`;
        } catch (ingestErr) {
          console.error('Document ingestion in chat failed:', ingestErr);
          fileContext = `[User uploaded a document named "${file.originalname}" but parsing failed: ${ingestErr.message}]`;
        }
      }

      fileType = file.mimetype.split('/')[0]; // audio, image, video, application

      // Voice input → transcribe
      if (fileType === 'audio') {
        try {
          const transcription = await transcribeAudio(file.buffer, file.mimetype, file.originalname, userLanguage);
          if (transcription && transcription.trim()) {
            userPrompt = transcription;
            fileContext = `[Voice transcription]: "${transcription}"`;
          } else {
            return res.status(200).json({
              success: true,
              text: 'I couldn\'t understand the audio. Could you try again or type your message?',
              type: 'voice_error'
            });
          }
        } catch (err) {
          console.error('Voice transcription error:', err.response?.data || err.message);
          return res.status(200).json({
            success: true,
            text: 'Voice transcription is temporarily unavailable. Please type your message instead.',
            type: 'voice_error'
          });
        }
      }
      // Image → save + describe
      else if (fileType === 'image') {
        fileUrl = saveFileLocally(req, file);
        try {
          const description = await describeImage(file.buffer, file.mimetype);
          fileContext = `[User uploaded an image: ${description}]. Image URL: ${fileUrl}`;
        } catch (err) {
          console.error('Image description error:', err.message);
          fileContext = `[User uploaded an image]. Image URL: ${fileUrl}`;
        }
      }
      // Other files (PDFs, docs, etc.) → save
      else {
        fileUrl = saveFileLocally(req, file);
        fileContext = `[User uploaded a file: ${file.originalname}, type: ${file.mimetype}]. File URL: ${fileUrl}`;
      }
    }

    // Combine prompt with file context
    const fullPrompt = fileContext
      ? `${fileContext}\n\nUser message: ${userPrompt || '(see uploaded content above)'}`
      : userPrompt;

    if (!fullPrompt || !fullPrompt.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a message, voice input, or file.' });
    }

    // Push to session history
    pushHistory(userId, 'user', fullPrompt);

    // ── Check pending actions (multi-turn) ──
    const pending = pendingActions.get(userId);
    if (pending && (Date.now() - pending.timestamp) < 5 * 60 * 1000) {
      // Investment flow: user is providing additional message for a pending request
      if (pending.action === 'request_investment' && pending.payload.startup_name) {
        pending.payload.message = userPrompt;
        pendingActions.delete(userId);
        const result = await handleRequestInvestment(userId, pending.payload);
        pushHistory(userId, 'assistant', result.content);
        return res.status(200).json({ success: true, text: result.content, type: result.type, data: result.data, fileUrl });
      }
      pendingActions.delete(userId);
    }

    // ── AI Router Intent Classification ──
    let routerConfig;
    try {
      routerConfig = await aiRouter.route(fullPrompt);
      console.log(`[RAG Router] Classified query as: ${routerConfig.route} (strategy: ${routerConfig.retrievalStrategy})`);
    } catch (routeErr) {
      console.error('RAG Router classification failed, defaulting to normal-chat:', routeErr);
      routerConfig = { route: 'normal-chat', retrievalStrategy: 'fallback', promptTemplate: null, sourceType: '' };
    }

    // ── If Route is not normal-chat, run RAG Pipeline ──
    if (routerConfig.route !== 'normal-chat') {
      try {
        console.log(`[RAG Execution] Starting retrieval for route: ${routerConfig.route}`);
        const retrievalResult = await retrievalService.retrieve(fullPrompt, userId, {
          sourceType: routerConfig.sourceType
        });

        console.log(`[RAG Execution] Retrieved ${retrievalResult.chunks.length} chunks, confidence: ${retrievalResult.confidence}`);

        const aiResponse = await groqService.generateAnswer(
          fullPrompt,
          retrievalResult,
          routerConfig.promptTemplate
        );

        pushHistory(userId, 'assistant', aiResponse.answer);

        return res.status(200).json({
          success: true,
          text: aiResponse.answer,
          type: 'chat_response',
          route: routerConfig.route,
          sources: aiResponse.sources,
          confidence: aiResponse.confidence,
          fileUrl,
          actions: ['Check my founder score', 'Analyze my startup', 'Search startups']
        });
      } catch (ragErr) {
        console.error('[RAG Execution] Failed, falling back to normal chat flow:', ragErr);
        // If RAG pipeline fails, we fallback to normal-chat route handling
        routerConfig.route = 'normal-chat';
      }
    }

    // ── Route the message ──
    let action = 'chat';
    let payload = {};

    try {
      if (isGroqConfigured()) {
        const routeText = await generateText(buildRouterPrompt(fullPrompt, { userId, userRole }), { temperature: 0.1 });
        const route = parseJsonFromText(routeText);
        action = route.action || 'chat';
        payload = route.payload || {};
      } else {
        throw new Error('Groq not configured');
      }
    } catch (routerErr) {
      console.warn('AI router unavailable, using fallback:', routerErr.message);
      const fallback = getFallbackRoute(fullPrompt, { userId, userRole });
      action = fallback.action;
      payload = fallback.payload;
    }

    // ── Execute action ──
    let result;

    switch (action) {
      case 'founder_score_check':
        if (userId === 'anonymous') {
          result = { type: 'missing_information', content: 'Please log in to check your Founder Score.' };
        } else {
          result = await handleFounderScoreCheck(userId);
        }
        break;

      case 'create_post':
        if (userId === 'anonymous') {
          result = { type: 'missing_information', content: 'Please log in to create a post.' };
        } else {
          result = await handleCreatePost(userId, payload, userPrompt);
        }
        break;

      case 'search_startups':
        result = await handleSearchStartups(payload);
        break;

      case 'request_investment':
        if (userId === 'anonymous') {
          result = { type: 'missing_information', content: 'Please log in to express investment interest.' };
        } else {
          result = await handleRequestInvestment(userId, payload);
        }
        break;

      case 'update_profile':
        result = await handleUpdateProfile(userId, payload);
        break;

      case 'startup_feedback':
        result = await handleStartupFeedback(userId);
        break;

      case 'accept_reject_application':
        result = await handleApplicationUpdate(userId, payload);
        break;

      case 'accept_reject_investment':
        result = await handleInvestmentRequestUpdate(userId, payload);
        break;

      case 'chat':
      default: {
        // General conversational chat
        let text = '';
        if (isGroqConfigured()) {
          try {
            const priorHistory = getHistory(userId).slice(0, -1); // Exclude the message we just pushed
            const systemPrompt = buildSystemPrompt(req.user, userLanguage);
            text = await chatWithHistory(systemPrompt, priorHistory, fullPrompt);
          } catch (chatErr) {
            console.warn('AI chat unavailable, using fallback:', chatErr.message);
            text = getFallbackChatResponse(userPrompt);
          }
        } else {
          text = getFallbackChatResponse(userPrompt);
        }
        pushHistory(userId, 'assistant', text);

        return res.status(200).json({
          success: true,
          text,
          type: 'chat_response',
          fileUrl,
          actions: [
            'Check my founder score',
            'Create a post',
            'Search startups',
            'Analyze my startup'
          ]
        });
      }
    }

    // Push result to history
    if (result && result.content) {
      pushHistory(userId, 'assistant', result.content);
    }

    // Dynamic actions based on result type
    const dynamicActions = {
      'founder_score': ['Create a post', 'Analyze my startup', 'Search startups'],
      'create_post': ['Check my founder score', 'Analyze my startup'],
      'search_results': ['Invest in a startup', 'Check my founder score'],
      'investment_requested': ['Search startups', 'Check my founder score'],
      'profile_updated': ['Check my founder score', 'Create a post'],
      'startup_feedback': ['Create a post', 'Update my profile', 'Search startups'],
      'application_updated': ['Check my founder score', 'Analyze my startup'],
      'investment_request_updated': ['Check my founder score', 'Search startups'],
    };

    return res.status(200).json({
      success: true,
      text: result.content,
      type: result.type,
      data: result.data || null,
      fileUrl,
      actions: dynamicActions[result.type] || ['Check my founder score', 'Create a post', 'Search startups', 'Analyze my startup']
    });

  } catch (error) {
    console.error('ChatbotAgent error:', error.response?.data || error.message || error);
    return res.status(200).json({
      success: true,
      text: getFallbackChatResponse(''),
      type: 'error_fallback',
      actions: ['Check my founder score', 'Create a post', 'Search startups']
    });
  }
});

// ──────────────────────────────────────────────────────────────────────
// VOICE-ONLY TRANSCRIPTION ENDPOINT
// (for frontends that transcribe first, then send text)
// ──────────────────────────────────────────────────────────────────────
router.post('/transcribe', optionalProtect, chatUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided.' });
    }
    if (!isGroqConfigured()) {
      return res.status(503).json({ success: false, error: 'Voice transcription service is not available.' });
    }

    const transcription = await transcribeAudio(req.file.buffer, req.file.mimetype, req.file.originalname);

    return res.status(200).json({
      success: true,
      text: transcription,
      type: 'transcription'
    });
  } catch (error) {
    console.error('Transcription error:', error.response?.data || error.message);
    return res.status(500).json({ success: false, error: 'Failed to transcribe audio.' });
  }
});

// ──────────────────────────────────────────────────────────────────────
// CLEAR SESSION HISTORY
// ──────────────────────────────────────────────────────────────────────
router.post('/clear', optionalProtect, (req, res) => {
  const userId = req.user ? req.user._id.toString() : 'anonymous';
  sessionHistories.delete(userId);
  pendingActions.delete(userId);
  res.status(200).json({ success: true, message: 'Chat session cleared.' });
});

module.exports = router;
