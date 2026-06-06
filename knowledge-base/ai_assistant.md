# FounderX AI Assistant, RAG Architecture, and Matchmaking Engine

## 1. Introduction
FounderX features an integrated AI Assistant that supports founders and investors across the platform. Rather than acting as a simple chatbot, the FounderX AI Assistant is powered by a Retrieval-Augmented Generation (RAG) pipeline, combining a vector search engine (Pinecone) with a high-performance LLM (Groq Llama 3.3).

This document outlines the AI Assistant's capabilities, RAG system architecture, security framework, and matchmaking workflows.

---

## 2. AI Capabilities & Features

### A. For Founders: Startup Analysis & Pitch Support
* **Traction & Metric Evaluation**: The assistant analyzes a startup's pitch deck, financial model, or profile details to highlight strengths and areas for improvement.
* **Pitch Deck Optimization**: Founders can upload draft pitch decks. The assistant evaluates the value proposition, market size analysis, and financial slides, offering recommendations to improve clarity.
* **Investor Readiness Check**: The assistant evaluates the startup's profile completeness, trust score, and traction metrics, recommending steps to optimize the profile for discovery.

### B. For Investors: Discovery & Due Diligence Support
* **Semantic Startup Discovery**: Investors can search for opportunities using natural language queries, such as:
  * *"Find me Pre-seed startups in vertical SaaS with an MVP and a founder who has previous exits."*
* **Investment Memorandums**: The assistant extracts key facts from a startup's uploaded documents to compile structured investment summaries, accelerating the due diligence process.
* **Matchmaking Reports**: The assistant runs the **Venture Matchmaker Engine** to find startups that align with an investor's preferences.

---

## 3. RAG System Architecture
The RAG pipeline enables the AI Assistant to retrieve relevant context from uploaded documents to generate accurate, source-backed responses.

```
                  ┌──────────────────────┐
                  │  Document Upload     │
                  └──────────┬───────────┘
                             │
                             ▼
             ┌──────────────────────────────┐
             │ Ingestion: Parser & Chunker  │
             └──────────────┬───────────────┘
                            │
                            ▼
             ┌──────────────────────────────┐
             │ Vector Indexing: Pinecone    │
             └──────────────┬───────────────┘
                            │
                            ▼
 ┌──────────┐      ┌─────────────────┐      ┌─────────────┐
 │ User     ├─────>│  AI Router      ├─────>│ Groq LLM    │
 │ Query    │      └────────┬────────┘      └──────▲──────┘
 └──────────┘               │                      │
                            ▼                      │
             ┌──────────────────────────────┐      │
             │ Context Retrieval & Rerank   ├──────┘
             └──────────────────────────────┘
```

### A. Document Ingestion, Parsing, and Chunking
1. **Extraction**: Documents are parsed based on their MIME type (PDFs using `PDFParse`, DOCX using `mammoth`, TXT as plain text).
2. **Semantic Chunking**: Extracted text is split into chunks of 500-800 tokens, maintaining heading and paragraph boundaries.
3. **Overlap**: Chunks include a 100-150 token overlap to preserve context across boundaries.

### B. Vector Indexing (Pinecone)
* Chunks are converted into vector embeddings and stored in Pinecone (`founderx-rag`).
* Vectors are enriched with metadata tags (e.g., `ownerId`, `startupId`, `sourceType`, `visibility`), enabling scoped and secure retrieval queries.

### C. Context Retrieval & Semantic Reranking
1. **Query Routing**: The `aiRouter.js` classifies the user's query intent into categories (e.g., `document-rag`, `startup-rag`, `investor-rag`, `matching-engine`, or `normal-chat`).
2. **Context Query**: If a RAG route is selected, the assistant queries Pinecone for matching vector chunks.
3. **Metadata Filtering**: The system filters results to only include public documents or documents owned by the querying user.
4. **Heuristic Reranking**: Matches undergo semantic reranking based on keyword frequency, co-occurrence, and document relevance to prioritize the most important context.

---

## 4. Venture Matchmaker Engine
The Matching Engine (`/api/rag/investor-match`) automates founder-investor pairing by analyzing data profiles and vector spaces.

### A. Matchmaking Workflow
1. The user requests a matchmaking analysis for a startup profile.
2. The engine retrieves the startup's industry, stage, funding needs, and description.
3. It queries the vector database for investor profiles that match these criteria, prioritizing investors with matching ticket sizes and industry preferences.
4. The system retrieves relevant chunks from the startup's pitch deck to build a matchmaking report.
5. The report highlights:
   * **Compatibility Score**: Calculated based on profile alignment and ticket sizes.
   * **Key Match Reasons**: Explaining why the investor is a good partner.
   * **Recommended Next Steps**: Directing the user to send an investment request or follow the profile.

---

## 5. Security & Trust Framework
The AI Assistant implements several security controls to protect data privacy and system stability:

### A. Security Features
* **Inbound Query Shielding**: Scans queries to block prompt injection attacks.
* **Context Sanitization**: Scans retrieved text from Pinecone to remove malicious instructions before passing it to the LLM, protecting the assistant from jailbreaks.
* **Access Filtering**: Metadata filters restrict RAG retrieval to public documents or documents owned by the querying user, maintaining strict data isolation.
