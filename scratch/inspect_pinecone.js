const { Pinecone } = require('@pinecone-database/pinecone');
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || 'fake-key' });
console.log('Pinecone Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pc)));
const index = pc.index('fake-index');
console.log('Pinecone Index methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(index)));
