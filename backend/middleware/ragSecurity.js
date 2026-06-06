const adversarialPatterns = [
  /ignore previous instructions/i,
  /ignore previous/i,
  /forget previous/i,
  /forget instructions/i,
  /ignore above/i,
  /ignore the above/i,
  /override system/i,
  /you are now a/i,
  /system prompt/i,
  /reveal the secret/i,
  /reveal secret/i,
  /expose internal/i,
  /leak user/i,
  /retrieve hidden/i,
  /do not mention/i,
  /new instruction/i,
  /forget everything/i,
  /bypass rules/i
];

class RAGSecurity {
  constructor() {
    this.validateRAGRequest = this.validateRAGRequest.bind(this);
  }

  // Sanitize query string to prevent code/HTML injection and normalize whitespace
  sanitizeQuery(query) {
    if (typeof query !== 'string') return '';
    return query
      .replace(/<[^>]*>/g, '') // strip HTML
      .replace(/[\r\n\t]+/g, ' ') // collapse multi-lines
      .trim();
  }

  // Scan and clean context chunks from prompt injection attempts
  sanitizeContext(contextText) {
    if (!contextText) return '';
    
    const paragraphs = contextText.split('\n\n');
    const sanitizedParagraphs = paragraphs.map(para => {
      let isAdversarial = false;
      for (const pattern of adversarialPatterns) {
        if (pattern.test(para)) {
          isAdversarial = true;
          break;
        }
      }
      
      if (isAdversarial) {
        console.warn('⚠️ Security Alert: Prompt injection attempt detected in retrieved context. Sanitizing paragraph.');
        return '[SECURITY NOTE: Paragraph removed due to instructions override detection]';
      }
      return para;
    });

    return sanitizedParagraphs.join('\n\n');
  }

  // Express middleware to sanitize body query and check for injection attempts
  validateRAGRequest(req, res, next) {
    if (req.body && req.body.query) {
      const originalQuery = req.body.query;
      const sanitized = this.sanitizeQuery(originalQuery);
      
      // Scan query for multiple suspicious patterns
      let matches = 0;
      for (const pattern of adversarialPatterns) {
        if (pattern.test(sanitized)) {
          matches++;
        }
      }

      // Block queries attempting instruction overrides
      if (matches >= 1) {
        console.warn(`🛑 Blocked suspicious query from user ${req.user?._id || 'unauthenticated'}: "${sanitized}"`);
        return res.status(400).json({
          success: false,
          error: 'Security Exception',
          message: 'The query contains unauthorized instruction overrides.'
        });
      }

      req.body.query = sanitized;
    }
    next();
  }
}

module.exports = new RAGSecurity();
