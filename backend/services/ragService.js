const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const storageService = require('./storageService');
const pineconeService = require('./pineconeService');
const Document = require('../models/Document');

class RAGService {
  // Extract raw text from file buffer based on MIME type
  async extractText(fileBuffer, mimeType) {
    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: fileBuffer });
      const data = await parser.getText();
      await parser.destroy();
      return data.text || '';
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value || '';
    } else if (mimeType?.startsWith('text/')) {
      return fileBuffer.toString('utf8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  // Chunk text into 500-800 tokens (approx 375-600 words) with 100-150 tokens overlap
  chunkText(text, documentId) {
    if (!text || typeof text !== 'string') return [];

    // Split on paragraphs to keep headings and blocks of text together
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (!para) continue;

      const words = para.split(/\s+/);
      const paraTokens = Math.ceil(words.length * 1.33); // 1 word ≈ 1.33 tokens

      // Handle exceptionally long paragraphs by splitting into sentences
      if (paraTokens > 750) {
        const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
        for (const sentence of sentences) {
          const sentenceWords = sentence.split(/\s+/);
          const sentenceTokens = Math.ceil(sentenceWords.length * 1.33);

          if (currentWordCount * 1.33 + sentenceTokens > 750) {
            if (currentChunk.length > 0) {
              chunks.push({
                chunkId: `${documentId}-chunk-${chunkIndex++}`,
                content: currentChunk.join(' '),
                position: chunkIndex
              });
              // Overlap: keep the last 2 sentences
              currentChunk = currentChunk.slice(Math.max(0, currentChunk.length - 2));
              currentWordCount = currentChunk.join(' ').split(/\s+/).length;
            }
          }
          currentChunk.push(sentence.trim());
          currentWordCount += sentenceWords.length;
        }
      } else {
        // Normal paragraphs
        if (currentWordCount * 1.33 + paraTokens > 750) {
          if (currentChunk.length > 0) {
            chunks.push({
              chunkId: `${documentId}-chunk-${chunkIndex++}`,
              content: currentChunk.join('\n\n'),
              position: chunkIndex
            });
            // Overlap: keep the last paragraph
            currentChunk = currentChunk.slice(Math.max(0, currentChunk.length - 1));
            currentWordCount = currentChunk.join('\n\n').split(/\s+/).length;
          }
        }
        currentChunk.push(para);
        currentWordCount += words.length;
      }
    }

    // Capture remaining text
    if (currentChunk.length > 0) {
      chunks.push({
        chunkId: `${documentId}-chunk-${chunkIndex++}`,
        content: currentChunk.join('\n\n'),
        position: chunkIndex
      });
    }

    return chunks;
  }

  // Full Ingestion Pipeline
  async ingestDocument({ fileBuffer, originalName, mimeType, ownerId, startupId, sourceType, visibility, host, protocol }) {
    // 1. Upload to storage abstraction
    console.log(`Starting storage upload for: ${originalName}`);
    const uploadResult = await storageService.upload(fileBuffer, originalName, mimeType, host, protocol);
    
    // Create new Document instance to pre-generate a valid MongoDB ObjectId _id
    const newDoc = new Document({
      ownerId,
      startupId: startupId || undefined,
      fileName: originalName,
      fileUrl: uploadResult.fileUrl,
      fileKey: uploadResult.fileKey,
      sourceType: sourceType || 'document',
      visibility: visibility || 'private',
      mimeType,
      sizeBytes: uploadResult.sizeBytes
    });

    const documentId = newDoc._id.toString();

    // 2. Extract text from buffer
    console.log(`Extracting text from: ${originalName} (${mimeType})`);
    const rawText = await this.extractText(fileBuffer, mimeType);
    if (!rawText.trim()) {
      throw new Error('No readable text could be extracted from this document.');
    }

    // 3. Generate semantic chunks
    console.log('Generating semantic chunks...');
    const chunks = this.chunkText(rawText, documentId);
    if (chunks.length === 0) {
      throw new Error('Document resulted in 0 text chunks.');
    }

    // 4. Ingest chunks into Pinecone
    console.log(`Upserting ${chunks.length} chunks to Pinecone...`);
    const uploadedAt = new Date();
    await pineconeService.upsertChunks(documentId, chunks, {
      ownerId,
      startupId,
      sourceType,
      visibility,
      uploadedAt,
      fileName: originalName
    });

    // 5. Store metadata registry in MongoDB/Mongoose
    console.log('Saving document metadata to database...');
    newDoc.chunkCount = chunks.length;
    newDoc.uploadedAt = uploadedAt;

    await newDoc.save();
    console.log(`✅ Ingestion pipeline complete. Registered document ${documentId}`);
    return newDoc;
  }
}

module.exports = new RAGService();
