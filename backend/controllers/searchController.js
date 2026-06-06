const { getAll, getById } = require('../utils/firebaseHelpers');

exports.globalSearch = async (req, res) => {
  try {
    let { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    q = q.trim();
    if (q.startsWith('@')) {
      q = q.substring(1);
    }

    const searchLower = q.toLowerCase();

    const [allUsers, allStartups, allPosts] = await Promise.all([
      getAll('users'),
      getAll('startups'),
      getAll('posts')
    ]);

    const users = allUsers
      .filter(
        (u) =>
          (u.username || '').toLowerCase().includes(searchLower) ||
          (u.name || u.fullName || '').toLowerCase().includes(searchLower) ||
          (u.email || '').toLowerCase().includes(searchLower)
      )
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        _id: u.id,
        name: u.name || u.fullName,
        username: u.username,
        role: u.role,
        profileImage: u.profileImage,
        isVerified: u.isVerified
      }));

    const startups = allStartups
      .filter(
        (s) =>
          (s.name || '').toLowerCase().includes(searchLower) ||
          (s.oneLinePitch || '').toLowerCase().includes(searchLower) ||
          (s.description || '').toLowerCase().includes(searchLower) ||
          (s.industry || '').toLowerCase().includes(searchLower)
      )
      .slice(0, 10)
      .map((s) => ({
        id: s.id,
        _id: s.id,
        name: s.name,
        logo: s.logo,
        oneLinePitch: s.oneLinePitch,
        industry: s.industry,
        stage: s.stage
      }));

    const posts = await Promise.all(
      allPosts
        .filter(
          (p) =>
            (p.content || '').toLowerCase().includes(searchLower) ||
            (p.tags || []).some((t) => (t || '').toLowerCase().includes(searchLower))
        )
        .slice(0, 10)
        .map(async (p) => {
          const author = p.authorId ? await getById('users', p.authorId) : null;
          return {
            id: p.id,
            _id: p.id,
            authorId: author
              ? { id: author.id, name: author.name || author.fullName, username: author.username, profileImage: author.profileImage }
              : p.authorId,
            content: p.content,
            contentType: p.contentType,
            createdAt: p.createdAt
          };
        })
    );

    res.json({
      success: true,
      data: { users, startups, posts }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error during search' });
  }
};
