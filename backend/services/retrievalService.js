const pineconeService = require('./pineconeService');
const rerankService = require('./rerankService');

class RetrievalService {
  /**
   * Retrieves the top 5 most relevant context chunks for a user query.
   * Enforces strict metadata filtering to prevent cross-user data leakage.
   * @param {string} queryText - The search query or question.
   * @param {string} userId - The authenticated user ID.
   * @param {object} options - Optional filters (sourceType, startupId).
   */
  async retrieve(queryText, userId, options = {}) {
    if (!userId) {
      throw new Error('User ID is required for secure retrieval filtering.');
    }

    // Build secure Pinecone metadata filter
    // Must belong to user OR be public
    const filter = {
      $or: [
        { ownerId: { $eq: userId.toString() } },
        { visibility: { $eq: 'public' } }
      ]
    };

    // Apply optional filters if specified
    if (options.sourceType) {
      filter.sourceType = { $eq: options.sourceType };
    }
    
    if (options.startupId) {
      filter.startupId = { $eq: options.startupId.toString() };
    }

    console.log('Querying Pinecone with filter:', JSON.stringify(filter));
    
    // Retrieve top 20 chunks from Pinecone
    const rawHits = await pineconeService.search(queryText, filter, 20);
    console.log(`Retrieved ${rawHits.length} raw hits from Pinecone.`);

    // Perform re-ranking on the top 20 hits to select the best 5
    const reRankedHits = rerankService.rerank(queryText, rawHits, {
      sourceTypeBoost: options.sourceType
    });
    console.log(`Re-ranked down to ${reRankedHits.length} high-confidence chunks.`);

    // Build context text
    const contextText = reRankedHits
      .map(hit => `[Source: ${hit.metadata?.sourceType || 'document'} | ID: ${hit.metadata?.documentId || 'unknown'}]\n${hit.content}`)
      .join('\n\n');

    // Calculate a confidence score (average of re-ranked scores, capped at 1.0)
    let confidence = 0;
    if (reRankedHits.length > 0) {
      const sum = reRankedHits.reduce((acc, h) => acc + (h.rerankScore || h.score), 0);
      confidence = parseFloat((sum / reRankedHits.length).toFixed(2));
      // Normalize to 0-100 range
      confidence = Math.min(100, Math.max(0, Math.round(confidence * 100)));
    }

    return {
      context: contextText,
      chunks: reRankedHits,
      confidence
    };
  }
}

module.exports = new RetrievalService();
