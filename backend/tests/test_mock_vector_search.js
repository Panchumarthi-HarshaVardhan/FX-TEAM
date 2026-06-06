require('dotenv').config();
const mongoose = require('mongoose');
const pineconeService = require('../services/pineconeService');

async function testMockVectorSearch() {
  console.log('--- START MOCK VECTOR SEARCH UNIT TEST ---');

  // Connect to Database
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/founderx';
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB at:', uri);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
  }

  const docId1 = '603f7e5ab912f2001f3cf9c1';
  const docId2 = '603f7e5ab912f2001f3cf9c2';

  const chunks1 = [
    { chunkId: `${docId1}-0`, content: 'FounderX is an advanced equity funding and startup networking platform.' },
    { chunkId: `${docId1}-1`, content: 'The mission of FounderX is to accelerate early-stage startup growth globally.' }
  ];

  const chunks2 = [
    { chunkId: `${docId2}-0`, content: 'We are raising a Seed round of $1.5M to hire engineers and expand marketing.' },
    { chunkId: `${docId2}-1`, content: 'Our CAC is $45, and LTV is $320, giving us a very strong unit economic profile.' }
  ];

  // 1. Ingest document 1 (private, user 1)
  console.log('\n[TEST 1] Ingesting Doc 1 (private, owner: user_abc)...');
  await pineconeService.upsertChunks(docId1, chunks1, {
    ownerId: 'user_abc',
    sourceType: 'document',
    visibility: 'private',
    uploadedAt: new Date()
  });

  // 2. Ingest document 2 (public, owner: user_abc)...
  console.log('\n[TEST 2] Ingesting Doc 2 (public, owner: user_abc)...');
  await pineconeService.upsertChunks(docId2, chunks2, {
    ownerId: 'user_abc',
    sourceType: 'pitchDeck',
    visibility: 'public',
    uploadedAt: new Date()
  });

  // 3. Search: user_abc querying for private docs
  console.log('\n[TEST 3] Searching query "equity funding" as user_abc...');
  const filter1 = {
    $or: [
      { ownerId: { $eq: 'user_abc' } },
      { visibility: { $eq: 'public' } }
    ]
  };
  const hits1 = await pineconeService.search('equity funding', filter1, 5);
  console.log(`Hits found: ${hits1.length}`);
  hits1.forEach(h => console.log(` - ID: ${h.id}, Score: ${h.score.toFixed(2)}, Text: "${h.content}"`));
  if (hits1.length === 0 || !hits1[0].content.includes('FounderX')) {
    throw new Error('Failed TEST 3: user_abc should have matched Doc 1 private chunks.');
  }

  // 4. Search: user_xyz querying (should only match public doc 2)
  console.log('\n[TEST 4] Searching query "mission" as user_xyz (should not see Doc 1 private)...');
  const filter2 = {
    $or: [
      { ownerId: { $eq: 'user_xyz' } },
      { visibility: { $eq: 'public' } }
    ]
  };
  const hits2 = await pineconeService.search('mission', filter2, 5);
  console.log(`Hits found: ${hits2.length}`);
  hits2.forEach(h => console.log(` - ID: ${h.id}, Score: ${h.score.toFixed(2)}, Text: "${h.content}"`));
  if (hits2.some(h => h.id.startsWith(docId1))) {
    throw new Error('Failed TEST 4: user_xyz should NOT match private Doc 1.');
  }

  // 5. Search: query "LTV" matching Doc 2
  console.log('\n[TEST 5] Searching query "CAC LTV" as user_xyz...');
  const hits3 = await pineconeService.search('CAC LTV', filter2, 5);
  console.log(`Hits found: ${hits3.length}`);
  hits3.forEach(h => console.log(` - ID: ${h.id}, Score: ${h.score.toFixed(2)}, Text: "${h.content}"`));
  if (hits3.length === 0 || !hits3[0].content.includes('LTV')) {
    throw new Error('Failed TEST 5: should match Doc 2 containing CAC and LTV.');
  }

  // 6. Search: general query (no match keywords) → Fallback to latest
  console.log('\n[TEST 6] Searching general query "what is the pdf about?" as user_abc (should trigger fallback to latest)...');
  const hits4 = await pineconeService.search('what is the pdf about?', filter1, 5);
  console.log(`Hits found: ${hits4.length}`);
  hits4.forEach(h => console.log(` - ID: ${h.id}, Score: ${h.score.toFixed(2)}, Text: "${h.content}"`));
  if (hits4.length === 0) {
    throw new Error('Failed TEST 6: fallback should have returned chunks.');
  }

  console.log('\n✅ ALL MOCK VECTOR SEARCH TESTS PASSED SUCCESSFULLY!');
  await mongoose.disconnect();
  process.exit(0);
}

testMockVectorSearch().catch(async err => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
