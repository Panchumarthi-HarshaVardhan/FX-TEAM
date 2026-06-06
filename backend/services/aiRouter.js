const axios = require('axios');

const routes = {
  NORMAL_CHAT: 'normal-chat',
  DOCUMENT_RAG: 'document-rag',
  STARTUP_RAG: 'startup-rag',
  INVESTOR_RAG: 'investor-rag',
  MATCHING_ENGINE: 'matching-engine'
};

const templates = {
  [routes.DOCUMENT_RAG]: `You are an advanced Document AI Assistant. Your task is to answer questions about the uploaded document using ONLY the provided context. If the answer cannot be found in the context, politely state that you do not know. Keep your answer professional and concise.

Retrieved Context:
{context}

Question: {question}
Answer:`,

  [routes.STARTUP_RAG]: `You are a Startup Expert Assistant. Answer the question about the startup using the retrieved startup profiles and information. Provide structural facts such as stage, metrics, revenue, and features.

Retrieved Context:
{context}

Question: {question}
Answer:`,

  [routes.INVESTOR_RAG]: `You are an Investor Relations Agent. Answer the question regarding investor preferences, active backers, ticket sizes, and investment focus using the retrieved context.

Retrieved Context:
{context}

Question: {question}
Answer:`,

  [routes.MATCHING_ENGINE]: `You are an AI Investment Matchmaking Engine. Evaluate the match between the startup(s) and potential investors in the retrieved context. Explain why they are a good match or identify gaps (e.g. industry fit, stage, or ticket size).

Retrieved Context:
{context}

Question: {question}
Answer:`
};

class AIRouter {
  routeQueryRuleBased(query) {
    const q = query.toLowerCase().trim();

    // 1. Document RAG keywords (highest priority)
    if (
      q.includes('pdf') || q.includes('docx') || q.includes('document') ||
      q.includes('file') || q.includes('deck') || q.includes('pitch') ||
      q.includes('summarize') || q.includes('upload') || q.includes('read')
    ) {
      return routes.DOCUMENT_RAG;
    }

    // 2. Matching Engine keywords
    if (
      q.includes('match') || q.includes('recommend') || q.includes('fit') ||
      q.includes('align') || q.includes('find backers') || q.includes('who is interested')
    ) {
      return routes.MATCHING_ENGINE;
    }

    // 3. Normal chat / Greetings / Platform Commands
    if (
      /^(hi|hello|hey|yo|g'day|good\s+morning|good\s+afternoon|good\s+evening)\b/i.test(q) ||
      q.includes('founder score') || q.includes('check my score') || q.includes('my score') ||
      q.includes('create post') || q.includes('write post') || q.includes('post about') || q.includes('milestone post') ||
      q.includes('update bio') || q.includes('update headline') || q.includes('update profile') || q.includes('update story') ||
      q.includes('analyze my startup') || q.includes('startup feedback') || q.includes('review my startup') ||
      q.includes('application') || q.includes('investment request') || q.includes('accept') || q.includes('reject')
    ) {
      return routes.NORMAL_CHAT;
    }

    // 4. Investor RAG keywords
    if (
      q.includes('investor') || q.includes('vc') || q.includes('angel') ||
      q.includes('fund') || q.includes('backer') || q.includes('capital')
    ) {
      return routes.INVESTOR_RAG;
    }

    // 5. Startup RAG keywords
    if (
      q.includes('startup') || q.includes('founder') || q.includes('company') ||
      q.includes('product') || q.includes('revenue') || q.includes('stage')
    ) {
      return routes.STARTUP_RAG;
    }

    return null; // Ambiguous, fall back to LLM
  }

  async route(query) {
    let route = this.routeQueryRuleBased(query);
    let strategy = 'rule';

    if (!route) {
      strategy = 'llm';
      try {
        const apiKey = process.env.GROQ_API_KEY;
        const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

        if (apiKey) {
          const res = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model,
              messages: [
                {
                  role: 'system',
                  content: `You are an intelligent query router. Classify the user query into exactly one of the following routes:
- normal-chat (general greetings, casual conversation, questions about the chatbot itself, platform commands like checking founder score or creating posts)
- document-rag (questions about uploaded documents, pitch decks, PDFs, docx, txt files)
- startup-rag (questions about startup details, products, traction, revenue, or profiles)
- investor-rag (questions about investor profiles, ticket sizes, preferred industries)
- matching-engine (queries asking to match startups with investors, or find best fits)

Respond with ONLY the name of the route in lowercase, nothing else.`
                },
                {
                  role: 'user',
                  content: query
                }
              ],
              temperature: 0
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const classification = res.data.choices[0].message.content.trim().toLowerCase();
          if (Object.values(routes).includes(classification)) {
            route = classification;
          }
        }
      } catch (err) {
        console.error('LLM classification failed, falling back to normal-chat:', err.message);
      }

      // Final default fallback
      if (!route) {
        route = routes.NORMAL_CHAT;
      }
    }

    // Configure retrieval parameters based on route classification
    let sourceTypeFilter = '';
    if (route === routes.DOCUMENT_RAG) {
      sourceTypeFilter = 'document';
    } else if (route === routes.STARTUP_RAG) {
      sourceTypeFilter = 'startupDoc';
    } else if (route === routes.INVESTOR_RAG) {
      sourceTypeFilter = 'founderDoc'; // mapped to investor/founder context docs
    }

    return {
      route,
      retrievalStrategy: strategy,
      promptTemplate: templates[route] || null,
      sourceType: sourceTypeFilter
    };
  }
}

module.exports = new AIRouter();
exportName = 'AIRouter'; // for reference
