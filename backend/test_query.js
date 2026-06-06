const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/founderx');
  
  let query = {
    $or: [
      { parentPostId: null },
      { parentPostId: { $exists: false } }
    ]
  };
  
  const posts = await Post.find(query);
  console.log('--- query.$or posts count:', posts.length);
  
  // Let's also see what getPosts controller query logic gets for a general feed request
  console.log('--- Fetching all posts without query filters:');
  const allPosts = await Post.find({});
  console.log('Total posts in db:', allPosts.length);
  const commentsInAll = allPosts.filter(p => p.parentPostId !== null && p.parentPostId !== undefined);
  console.log('Comments in all (non-null parentPostId):', commentsInAll.length);
  commentsInAll.forEach(c => {
    console.log(`Comment: ${c._id} - ${c.content} (parentPostId: ${c.parentPostId})`);
  });

  // Let's test standard find with the $or query
  const queryResult = await Post.find({
    $or: [
      { parentPostId: null },
      { parentPostId: { $exists: false } }
    ]
  });
  console.log('Query result count:', queryResult.length);
  
  const commentInQueryResult = queryResult.filter(p => p.parentPostId !== null && p.parentPostId !== undefined);
  console.log('Comments that leaked into query result:', commentInQueryResult.length);

  await mongoose.connection.close();
}

test();
