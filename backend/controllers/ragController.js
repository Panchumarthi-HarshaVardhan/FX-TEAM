const ragService = require('../services/ragService');
const retrievalService = require('../services/retrievalService');
const aiRouter = require('../services/aiRouter');
const groqService = require('../services/groqService');
const pineconeService = require('../services/pineconeService');
const Document = require('../models/Document');
const axios = require('axios');

class RAGController {
  // POST /api/rag/upload
  async uploadDocument(req, res) {
    try {
      const file = req.file;
      const { startupId, sourceType, visibility } = req.body;
      const ownerId = req.user._id;

      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';

      const doc = await ragService.ingestDocument({
        fileBuffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        ownerId,
        startupId,
        sourceType,
        visibility,
        host,
        protocol
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded and indexed successfully.',
        data: doc
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        error: 'Upload Failed',
        message: error.message || 'Internal Server Error'
      });
    }
  }

  // GET /api/rag/document/:id
  async getDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const doc = await Document.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Not Found', message: 'Document not found.' });
      }

      // Verify ownership
      if (doc.ownerId.toString() !== userId.toString() && doc.visibility !== 'public') {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'You do not have access to this document.' });
      }

      res.status(200).json({
        success: true,
        data: doc
      });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
  }

  // GET /api/rag/documents
  async getDocuments(req, res) {
    try {
      const userId = req.user._id;
      const docs = await Document.find({ ownerId: userId }).sort({ uploadedAt: -1 });
      res.status(200).json({
        success: true,
        data: docs
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
  }

  // POST /api/rag/search
  async semanticSearch(req, res) {
    try {
      const { query, limit, sourceType, startupId } = req.body;
      const userId = req.user._id;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'Query string is required.' });
      }

      // Build secure filter
      const filter = {
        $or: [
          { ownerId: { $eq: userId.toString() } },
          { visibility: { $eq: 'public' } }
        ]
      };

      if (sourceType) {
        filter.sourceType = { $eq: sourceType };
      }
      if (startupId) {
        filter.startupId = { $eq: startupId.toString() };
      }

      const hits = await pineconeService.search(query, filter, limit || 10);

      res.status(200).json({
        success: true,
        data: hits
      });
    } catch (error) {
      console.error('Semantic search error:', error);
      res.status(500).json({ success: false, error: 'Search Failed', message: error.message });
    }
  }

  // POST /api/rag/chat
  async chat(req, res) {
    try {
      const { query, startupId, stream } = req.body;
      const userId = req.user._id;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'Query string is required.' });
      }

      // 1. AI Router classifies query and selects template
      const routerConfig = await aiRouter.route(query);

      // 2. Retrieve relevant chunks with secure filters
      const retrievalResult = await retrievalService.retrieve(query, userId, {
        sourceType: routerConfig.sourceType,
        startupId
      });

      // 3. Handle Streaming Response (SSE)
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders && res.flushHeaders();

        const apiKey = process.env.GROQ_API_KEY;
        const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

        if (!apiKey) {
          // Send simulated stream for demo if API key is missing
          const dummyText = `[DEMO STREAM] Here is context-based information on "${query}". (Note: GROQ_API_KEY not configured).`;
          const words = dummyText.split(' ');
          for (const word of words) {
            res.write(`data: ${JSON.stringify({ token: word + ' ' })}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 80));
          }
          res.write(`data: ${JSON.stringify({ 
            done: true, 
            sources: retrievalResult.chunks.map(c => ({ documentId: c.metadata?.documentId, score: c.rerankScore || c.score })),
            confidence: retrievalResult.confidence
          })}\n\n`);
          res.end();
          return;
        }

        // Get Stream from Groq API
        const systemPrompt = routerConfig.promptTemplate
          .replace('{context}', retrievalResult.context)
          .replace('{question}', query);

        try {
          const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model,
              messages: [{ role: 'user', content: systemPrompt }],
              temperature: 0.2,
              stream: true
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              responseType: 'stream'
            }
          );

          let buffer = '';
          response.data.on('data', (chunk) => {
            const chunkStr = chunk.toString();
            buffer += chunkStr;
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep partial line in buffer

            for (const line of lines) {
              const cleaned = line.trim();
              if (cleaned.startsWith('data: ')) {
                const dataStr = cleaned.slice(6);
                if (dataStr === '[DONE]') {
                  // End of completion
                  continue;
                }
                try {
                  const json = JSON.parse(dataStr);
                  const token = json.choices[0]?.delta?.content || '';
                  if (token) {
                    res.write(`data: ${JSON.stringify({ token })}\n\n`);
                  }
                } catch (err) {
                  // Ignore parse errors on SSE meta lines
                }
              }
            }
          });

          response.data.on('end', () => {
            // Send metadata payload at the end
            res.write(`data: ${JSON.stringify({
              done: true,
              sources: retrievalResult.chunks.map(c => ({
                documentId: c.metadata?.documentId,
                fileName: c.metadata?.fileName || 'document',
                sourceType: c.metadata?.sourceType,
                score: c.rerankScore || c.score
              })),
              confidence: retrievalResult.confidence,
              route: routerConfig.route
            })}\n\n`);
            res.end();
          });
        } catch (streamErr) {
          console.error('Stream setup failed:', streamErr);
          res.write(`data: ${JSON.stringify({ error: 'Stream error', message: streamErr.message })}\n\n`);
          res.end();
        }
      } else {
        // 4. Handle Non-Streaming response
        const aiResponse = await groqService.generateAnswer(
          query,
          retrievalResult,
          routerConfig.promptTemplate
        );

        res.status(200).json({
          success: true,
          data: {
            ...aiResponse,
            route: routerConfig.route
          }
        });
      }
    } catch (error) {
      console.error('RAG Chat controller error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Generation Failed', message: error.message });
      }
    }
  }

  // POST /api/rag/investor-match
  async investorMatch(req, res) {
    try {
      const { startupId } = req.body;
      const userId = req.user._id;

      if (!startupId) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'startupId is required.' });
      }

      // Query database for the startup to match
      const StartupModel = require('../models/Startup');
      const startup = await StartupModel.findById(startupId);
      if (!startup) {
        return res.status(404).json({ success: false, error: 'Not Found', message: 'Startup not found.' });
      }

      // Build search query based on startup description/pitch
      const searchQuery = `Match investor for startup: ${startup.name}. Industry: ${startup.industry}. Stage: ${startup.stage}. Line: ${startup.oneLinePitch}. Descr: ${startup.description || ''}`;

      // Search for matches in investor profiles (sourceType: 'founderDoc' or stored documents)
      const filter = {
        visibility: { $eq: 'public' }
      };

      console.log('Retrieving matchmaking profiles from Pinecone...');
      const hits = await pineconeService.search(searchQuery, filter, 10);

      // Render response using Groq match template
      const context = hits.map(h => h.content).join('\n\n');
      const matchResult = await retrievalService.retrieve(searchQuery, userId, {
        sourceType: 'founderDoc'
      });

      const matchmakingPrompt = `You are a professional venture matchmaking algorithm.
Analyze the following startup and the potential investor matches retrieved from our database.
Provide a detailed matching report explaining the score, alignment points, and potential next steps.

Startup:
Name: ${startup.name}
Industry: ${startup.industry}
Stage: ${startup.stage}
Pitch: ${startup.oneLinePitch}

Retrieved Investor Context:
${context || 'No specific investor documents found in vector registry.'}

Report:`;

      const aiResponse = await groqService.generateAnswer(
        'Generate matchmaking report',
        matchResult,
        matchmakingPrompt
      );

      res.status(200).json({
        success: true,
        data: aiResponse
      });
    } catch (error) {
      console.error('Investor matchmaking error:', error);
      res.status(500).json({ success: false, error: 'Matchmaking Failed', message: error.message });
    }
  }
}

module.exports = new RAGController();
