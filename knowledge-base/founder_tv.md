# FounderTV Video Publishing and Discoverability Engine

## 1. Introduction
FounderTV is the native video-sharing and streaming platform embedded inside the FounderX ecosystem. Recognizing that static slide decks and text posts cannot fully capture a founder's vision, team dynamic, or product polish, FounderTV provides a dynamic space to showcase pitch videos, product demos, founder vlogs, and customer testimonials.

This document outlines the purpose of FounderTV, the video uploading and publishing workflow, discovery interfaces, community engagement tools, and recommendation mechanics.

---

## 2. The Purpose of FounderTV
FounderTV is designed to:
* **Humanize the Pitch**: Allow founders to convey passion, leadership, and communication skills directly to potential investors.
* **Streamline Product Demos**: Give builders a direct medium to showcase live product usage, feature releases, and developer walk-throughs.
* **Enable Rich Discovery**: Provide investors with a lean-back watch experience where they can browse pitches and find startups visually.
* **Enhance Social Engagement**: Enable high-impact video sharing across the community feed.

---

## 3. Video Publishing Workflow
Founders can publish two distinct types of video content on FounderTV:
1. **Short-Form Pitches (Micro-Pitches)**: Up to 90 seconds, optimized for mobile viewing and fast browsing.
2. **Long-Form Presentations (Deep Dives)**: Up to 15 minutes, suitable for detailed product walk-throughs, market analysis, and slide presentations.

### A. Step-by-Step Publishing Steps
1. **Initiate Upload**: The founder navigates to `/upload` or clicks the "Post Video" button on the dashboard.
2. **Video Asset Selection**: The user selects a video file (supported formats: `.mp4`, `.mov`, `.webm`, max size: 100MB).
3. **Metadata Input**:
   * **Title**: A catchy, descriptive title for the video.
   * **Description**: A summary of the video content, including hashtags (e.g., `#demoday`, `#fintech`) and mentions of team members or startups.
   * **Category**: e.g., Pitch, Product Demo, Founder Vlog, Update, Q&A.
   * **Associated Startup**: Linking the video to one of the founder's active startup profiles.
4. **Thumbnail Selection**: The founder can upload a custom cover image or let the system generate one from the video timeline.
5. **Processing**: The video is processed, optimized, and saved. The metadata is recorded in the `Video` collection, and the post is indexed in the Pinecone vector database for search.
6. **Publication**: The video is live, automatically generating a post card on the community feed and appearing in the FounderTV catalog (`/foundertv`).

---

## 4. Content Discovery
Discovering content on FounderTV is optimized for both casual browsing and targeted deal sourcing:

### A. The Watch Interface (`/watch`)
* The main `/watch` page presents a responsive video player interface.
* Users can scroll through a feed of short-form pitches or click to view long-form startup presentations.
* A sidebar displays "Recommended Videos" based on the user's role, historical views, and industry interests.

### B. Startup Profile Integration
* Every video associated with a startup profile is aggregated in the "Videos" tab on the startup's page.
* When an investor visits a startup profile, they can view these videos directly on the page, helping them evaluate progress over time.

---

## 5. Community Engagement Features
FounderTV integrates standard social features with professional action triggers:

### A. Social Interactions
* **Likes and Reactions**: Users can react to videos to express interest or support.
* **Inline Comment Threading**: Users can post comments, ask clarifying questions, and reply to threads directly under the video player.
* **Sharing**: Clickable share links copy the video URL to the clipboard or share it directly to other social platforms.

### B. Action Triggers
* When an investor watches a video and wants to contact the company:
  * An **Express Interest** button is rendered directly below the player for linked startup videos. Clicking this opens the `SendInterestRequestModal`, enabling the investor to submit an investment request immediately.
  * A **Connect** button allows the user to follow the founder directly.

---

## 6. Video Recommendation Mechanics
The recommendation algorithm is designed to surface relevant opportunities to investors and interesting updates to the founder community:

### A. Algorithm Inputs
The recommendation engine uses several signals:
* **User Persona & Role**: Investors are recommended pitch videos that match their investment preferences (industry, stage, ticket size).
* **View History**: Surfacing videos from similar industries or stages based on previous views.
* **Traction & Engagement**: Popular videos with high comments, likes, or watch completion rates are prioritized in trending sections.
* **Semantic Alignment (RAG)**: The AI Assistant can recommend specific videos during chat conversations. If an investor asks: *"Show me some AI demos in retail,"* the assistant fetches video transcripts and metadata from Pinecone, presenting the video cards directly inline in the chat feed.
* **News Integration**: Videos tagged with traction updates are pushed to connected investors' dashboards, ensuring high-priority visibility.
