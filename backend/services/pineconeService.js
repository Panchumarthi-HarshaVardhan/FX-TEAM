const { Pinecone } = require('@pinecone-database/pinecone');

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX || 'foundx-rag';

let pc = null;
let index = null;
let isConfigured = false;
let isIntegratedEmbeddings = true; // Default fallback

const initPinecone = async () => {
  if (!apiKey) {
    console.warn('⚠️ PINECONE_API_KEY is not defined in .env, running Pinecone in mockup mode');
    return false;
  }
  try {
    pc = new Pinecone({ apiKey });
    index = pc.index(indexName);
    
    // Detect Pinecone configuration
    const description = await pc.describeIndex(indexName);
    if (description && description.embed) {
      isIntegratedEmbeddings = true;
      console.log(`✅ Pinecone index "${indexName}" uses Integrated Embeddings (${description.embed.model}).`);
    } else {
      isIntegratedEmbeddings = false;
      console.log(`ℹ️ Pinecone index "${indexName}" uses standard vector storage. Will embed queries via Pinecone Inference.`);
    }
    
    isConfigured = true;
    return true;
  } catch (err) {
    console.error('❌ Error initializing Pinecone:', err.message);
    console.warn('⚠️ Falling back to mockup Pinecone mode');
    isConfigured = false;
    return false;
  }
};

// Auto-run init
initPinecone();

const mockStore = [];
let databaseLoaded = false;

function evaluateFilter(metadata, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const key of Object.keys(filter)) {
    if (key === '$or') {
      const conditions = filter.$or;
      if (!Array.isArray(conditions)) return false;
      let matched = false;
      for (const cond of conditions) {
        if (evaluateFilter(metadata, cond)) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    } else if (key === '$and') {
      const conditions = filter.$and;
      if (!Array.isArray(conditions)) return false;
      for (const cond of conditions) {
        if (!evaluateFilter(metadata, cond)) {
          return false;
        }
      }
    } else {
      const value = metadata[key];
      const condition = filter[key];
      if (typeof condition === 'object' && condition !== null) {
        if ('$eq' in condition) {
          if (value !== condition.$eq) return false;
        }
        if ('$ne' in condition) {
          if (value === condition.$ne) return false;
        }
        if ('$in' in condition) {
          if (!Array.isArray(condition.$in) || !condition.$in.includes(value)) return false;
        }
        if ('$nin' in condition) {
          if (Array.isArray(condition.$nin) && condition.$nin.includes(value)) return false;
        }
      } else {
        if (value !== condition) return false;
      }
    }
  }
  return true;
}

function calculateScore(text, query) {
  if (!text || !query) return 0;
  const textLower = text.toLowerCase();
  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 1);
  if (queryWords.length === 0) {
    return textLower.includes(query.toLowerCase()) ? 1.0 : 0.0;
  }

  let matchCount = 0;
  for (const word of queryWords) {
    if (textLower.includes(word)) {
      matchCount++;
    }
  }

  const queryLower = query.toLowerCase();
  let boost = 0;
  if (textLower.includes(queryLower)) {
    boost = 2.0;
  }

  return (matchCount / queryWords.length) + boost;
}

const loadDatabaseToMockStore = async () => {
  if (databaseLoaded) return;
  try {
    const Document = require('../models/Document');
    const ragService = require('./ragService');
    const storageService = require('./storageService');

    const docs = await Document.find({});
    console.log(`[Mock Mode] Found ${docs.length} documents in DB. Loading into mock Pinecone...`);
    for (const doc of docs) {
      try {
        const fileBuffer = await storageService.download(doc.fileKey);
        const text = await ragService.extractText(fileBuffer, doc.mimeType);
        const chunks = ragService.chunkText(text, doc._id.toString());
        const docIdStr = doc._id.toString();

        // Check if already in store
        const exists = mockStore.some(chunk => chunk.metadata.documentId === docIdStr);
        if (exists) continue;

        const records = chunks.map((chunk) => ({
          id: chunk.chunkId,
          content: chunk.content,
          metadata: {
            text: chunk.content,
            ownerId: doc.ownerId?.toString() || '',
            documentId: docIdStr,
            startupId: doc.startupId?.toString() || '',
            sourceType: doc.sourceType || 'document',
            visibility: doc.visibility || 'private',
            uploadedAt: doc.uploadedAt || new Date(),
            fileName: doc.fileName || ''
          }
        }));

        mockStore.push(...records);
        console.log(`[Mock Mode] Loaded doc ${doc.fileName} (${chunks.length} chunks).`);
      } catch (err) {
        console.error(`[Mock Mode] Failed to load doc ${doc.fileName}:`, err.message);
      }
    }
    databaseLoaded = true;
  } catch (err) {
    console.error('[Mock Mode] Failed to load documents from database:', err.message);
  }
};

class PineconeService {
  async upsertChunks(documentId, chunks, metadata) {
    if (!isConfigured) {
      const initialized = await initPinecone();
      if (!initialized) {
        console.log('Mockup Pinecone Ingestion: Simulating chunks ingestion...');
        // In-memory mock storage
        const docIdStr = documentId ? documentId.toString() : '';
        const records = chunks.map((chunk) => ({
          id: chunk.chunkId,
          content: chunk.content,
          metadata: {
            text: chunk.content,
            ownerId: metadata.ownerId?.toString() || '',
            documentId: docIdStr,
            startupId: metadata.startupId?.toString() || '',
            sourceType: metadata.sourceType || 'document',
            visibility: metadata.visibility || 'private',
            uploadedAt: metadata.uploadedAt || new Date(),
            fileName: metadata.fileName || ''
          }
        }));

        // Remove existing chunks for this documentId if any
        for (let i = mockStore.length - 1; i >= 0; i--) {
          if (mockStore[i].metadata.documentId === docIdStr) {
            mockStore.splice(i, 1);
          }
        }

        mockStore.push(...records);
        console.log(`✅ [Mock Mode] Stored ${chunks.length} chunks in-memory for document ${documentId}. Total chunks: ${mockStore.length}`);
        return;
      }
    }

    try {
      if (isIntegratedEmbeddings) {
        // Flat records for Integrated Ingestion
        const records = chunks.map((chunk) => ({
          id: chunk.chunkId,
          text: chunk.content, // Map content to text field
          ownerId: metadata.ownerId?.toString() || '',
          documentId: documentId?.toString() || '',
          startupId: metadata.startupId?.toString() || '',
          sourceType: metadata.sourceType || 'document',
          visibility: metadata.visibility || 'private',
          uploadedAt: metadata.uploadedAt?.toISOString() || new Date().toISOString(),
          fileName: metadata.fileName || ''
        }));

        await index.upsertRecords({ records });
        console.log(`✅ Upserted ${chunks.length} chunks to Pinecone index using Integrated Embeddings.`);
      } else {
        // Bring-Your-Own-Embeddings Flow (but using Pinecone Inference API to do the embedding on Pinecone's side)
        const textInputs = chunks.map(c => c.content);
        
        console.log('Generating embeddings via Pinecone Inference...');
        const embedResponse = await pc.inference.embed({
          model: 'llama-text-embed-v2',
          inputs: textInputs,
          parameters: { inputType: 'passage' }
        });

        const records = chunks.map((chunk, i) => ({
          id: chunk.chunkId,
          values: embedResponse.data[i].values,
          metadata: {
            text: chunk.content,
            ownerId: metadata.ownerId?.toString() || '',
            documentId: documentId?.toString() || '',
            startupId: metadata.startupId?.toString() || '',
            sourceType: metadata.sourceType || 'document',
            visibility: metadata.visibility || 'private',
            uploadedAt: metadata.uploadedAt?.toISOString() || new Date().toISOString(),
            fileName: metadata.fileName || ''
          }
        }));

        await index.upsert(records);
        console.log(`✅ Upserted ${chunks.length} chunks to Pinecone index using generated embeddings.`);
      }
    } catch (err) {
      console.error('Pinecone upsert failed:', err);
      throw new Error(`Pinecone ingestion failure: ${err.message}`);
    }
  }

  async search(queryText, filter, limit = 10) {
    if (!isConfigured) {
      const initialized = await initPinecone();
      if (!initialized) {
        console.log('Mockup Pinecone Search: Searching in-memory mock store...');
        await loadDatabaseToMockStore();

        // Evaluate filters
        let matchedChunks = mockStore.filter(chunk => evaluateFilter(chunk.metadata, filter));
        
        if (matchedChunks.length === 0) {
          console.log('[Mock Mode Search] 0 chunks matched filters.');
          return [];
        }

        // Calculate score
        matchedChunks = matchedChunks.map(chunk => {
          const score = calculateScore(chunk.content, queryText);
          return { ...chunk, score };
        });

        // Sort by score descending
        matchedChunks.sort((a, b) => b.score - a.score);

        // Check if the best match is actually a match (score > 0)
        const bestScore = matchedChunks[0].score;
        if (bestScore === 0) {
          console.log('[Mock Mode Search] No keyword matches. Falling back to most recently uploaded document chunks...');
          matchedChunks.sort((a, b) => {
            const timeA = new Date(a.metadata.uploadedAt || 0).getTime();
            const timeB = new Date(b.metadata.uploadedAt || 0).getTime();
            if (timeB !== timeA) {
              return timeB - timeA;
            }
            return (a.id < b.id) ? -1 : 1;
          });

          matchedChunks = matchedChunks.map((chunk, index) => ({
            ...chunk,
            score: Math.max(0.1, 0.9 - (index * 0.05))
          }));
        } else {
          // Keep only chunks with score > 0
          matchedChunks = matchedChunks.filter(c => c.score > 0);
        }

        const limitMatches = matchedChunks.slice(0, limit);
        console.log(`[Mock Mode Search] Found ${limitMatches.length} matching chunks.`);
        
        return limitMatches.map(match => ({
          id: match.id,
          score: match.score,
          content: match.content,
          metadata: match.metadata
        }));
      }
    }

    try {
      if (isIntegratedEmbeddings) {
        const response = await index.searchRecords({
          query: {
            inputs: { text: queryText },
            topK: limit,
            filter: filter || {}
          }
        });

        const hits = response.result?.hits || [];
        return hits.map((hit) => ({
          id: hit._id,
          score: hit._score || 0,
          content: hit.fields?.text || '',
          metadata: {
            ownerId: hit.fields?.ownerId || '',
            documentId: hit.fields?.documentId || '',
            startupId: hit.fields?.startupId || '',
            sourceType: hit.fields?.sourceType || '',
            visibility: hit.fields?.visibility || '',
            uploadedAt: hit.fields?.uploadedAt || '',
            fileName: hit.fields?.fileName || ''
          }
        }));
      } else {
        // Query standard vector index: Get query embedding first
        const embedResponse = await pc.inference.embed({
          model: 'llama-text-embed-v2',
          inputs: [queryText],
          parameters: { inputType: 'query' }
        });

        const queryVector = embedResponse.data[0].values;
        const response = await index.query({
          vector: queryVector,
          topK: limit,
          filter: filter || {},
          includeMetadata: true
        });

        const matches = response.matches || [];
        return matches.map((match) => ({
          id: match.id,
          score: match.score || 0,
          content: match.metadata?.text || '',
          metadata: match.metadata || {}
        }));
      }
    } catch (err) {
      console.error('Pinecone search failed:', err);
      throw new Error(`Pinecone query failure: ${err.message}`);
    }
  }

  async deleteDocument(documentId) {
    if (!isConfigured) {
      const docIdStr = documentId ? documentId.toString() : '';
      for (let i = mockStore.length - 1; i >= 0; i--) {
        if (mockStore[i].metadata.documentId === docIdStr) {
          mockStore.splice(i, 1);
        }
      }
      console.log(`✅ [Mock Mode] Deleted Pinecone chunks for document ${documentId}`);
      return;
    }
    try {
      await index.deleteMany({
        filter: { documentId: { $eq: documentId.toString() } }
      });
      console.log(`✅ Deleted Pinecone chunks for document ${documentId}`);
    } catch (err) {
      console.error(`Error deleting document ${documentId} chunks from Pinecone:`, err);
    }
  }
}

module.exports = new PineconeService();
