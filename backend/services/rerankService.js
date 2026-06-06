class RerankService {
  /**
   * Re-ranks a list of retrieved vector search hits based on keyword overlap,
   * exact phrase matches, and metadata relevance.
   * @param {string} query - The raw search query.
   * @param {Array} hits - The list of matches retrieved from Pinecone.
   * @param {object} options - Optional boosts (e.g. { sourceTypeBoost: 'pitchDeck' }).
   * @returns {Array} - The top 5 re-ranked results.
   */
  rerank(query, hits, options = {}) {
    if (!hits || hits.length === 0) return [];

    const cleanQuery = query.trim().toLowerCase();
    const queryTerms = cleanQuery.split(/[^a-zA-Z0-9]+/).filter(t => t.length > 2);
    
    const scoredHits = hits.map(hit => {
      let score = hit.score; // Base Pinecone score
      const text = (hit.content || hit.metadata?.text || hit.fields?.text || '').toLowerCase();

      // Heuristic 1: Exact Query Phrase Match
      if (text.includes(cleanQuery)) {
        score += 0.2; // Significant boost for exact match
      }

      // Heuristic 2: Keyword Term Frequency Matching
      let termMatches = 0;
      queryTerms.forEach(term => {
        if (text.includes(term)) {
          termMatches += 1;
          
          // Count occurrences in the chunk text
          const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const occurrences = (text.match(new RegExp(escapedTerm, 'g')) || []).length;
          score += Math.min(occurrences * 0.015, 0.08); // max 0.08 boost per keyword
        }
      });

      // Heuristic 3: Coverage Ratio Boost (Co-occurrence)
      if (queryTerms.length > 1) {
        const coverageRatio = termMatches / queryTerms.length;
        score += coverageRatio * 0.12; // Boost if most of query keywords are in the same chunk
      }

      // Heuristic 4: Source Relevance Boost
      if (options.sourceTypeBoost && hit.metadata?.sourceType === options.sourceTypeBoost) {
        score += 0.05;
      }

      return {
        ...hit,
        rerankScore: parseFloat(score.toFixed(4))
      };
    });

    // Sort by rerankScore descending
    scoredHits.sort((a, b) => b.rerankScore - a.rerankScore);

    // Limit to top 5 results as requested
    return scoredHits.slice(0, 5);
  }
}

module.exports = new RerankService();
