const axios = require('axios');
const ragSecurity = require('../middleware/ragSecurity');

class GroqService {
  /**
   * Generates an AI answer using Groq with retrieved context.
   * @param {string} query - User question.
   * @param {object} retrievalResult - Retrieved context and chunks ({ context, chunks, confidence }).
   * @param {string} template - The prompt template to use.
   */
  async generateAnswer(query, retrievalResult, template) {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEY is not defined in .env, running in mockup response mode');
      return {
        answer: `[MOCK RESPONSE] Here is a mock response regarding your query "${query}". Please configure GROQ_API_KEY in your backend .env file to enable live answers. Retrieved context contains ${retrievalResult.chunks?.length || 0} chunks.`,
        sources: retrievalResult.chunks.map(c => ({
          documentId: c.metadata?.documentId || 'unknown',
          fileName: c.metadata?.fileName || 'document',
          sourceType: c.metadata?.sourceType || 'document',
          score: c.rerankScore || c.score
        })),
        confidence: retrievalResult.confidence
      };
    }

    try {
      // 1. Sanitize context to prevent prompt injection attempts
      const sanitizedContext = ragSecurity.sanitizeContext(retrievalResult.context);

      // 2. Format Prompt Template
      const systemPrompt = template
        .replace('{context}', sanitizedContext)
        .replace('{question}', query);

      // 3. Make Groq Chat Completion Request
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'user',
              content: systemPrompt
            }
          ],
          temperature: 0.2
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const answer = response.data.choices[0].message.content;

      // 4. Map Sources with safe metadata properties
      // Group by documentId to avoid returning duplicate citations
      const sourcesMap = {};
      retrievalResult.chunks.forEach(chunk => {
        const docId = chunk.metadata?.documentId;
        if (docId && !sourcesMap[docId]) {
          sourcesMap[docId] = {
            documentId: docId,
            fileName: chunk.metadata?.fileName || 'document',
            sourceType: chunk.metadata?.sourceType || 'document',
            score: chunk.rerankScore || chunk.score
          };
        }
      });

      return {
        answer,
        sources: Object.values(sourcesMap),
        confidence: retrievalResult.confidence
      };
    } catch (err) {
      console.error('Groq answer generation failed:', err);
      throw new Error(`LLM Generation failure: ${err.message}`);
    }
  }
}

module.exports = new GroqService();
