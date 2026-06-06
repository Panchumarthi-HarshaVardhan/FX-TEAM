const { getAll, getById, filter } = require('../utils/firebaseHelpers');

exports.getFounderDashboard = async (req, res) => {
  try {
    const founderId = req.user.id;
    const startups = await filter('startups', (s) => s.founderId === founderId);
    const products = await filter('products', (p) => p.founderId === founderId);
    let orders = await filter('orders', (o) => o.founderId === founderId);
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    orders = await Promise.all(
      orders.map(async (order) => {
        const user = order.userId ? await getById('users', order.userId) : null;
        const product = order.productId ? await getById('products', order.productId) : null;
        return {
          ...order,
          userId: user ? { id: user.id, name: user.name || user.fullName, email: user.email } : order.userId,
          productId: product ? { id: product.id, name: product.name, price: product.price } : order.productId
        };
      })
    );

    const analytics = {
      totalStartups: startups.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      revenue: orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0)
    };

    res.status(200).json({ success: true, data: { startups, products, orders, analytics } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getInvestorDashboard = async (req, res) => {
  try {
    const allStartups = await getAll('startups');
    const savedStartups = allStartups.slice(0, 5);

    const allPosts = await filter('posts', (p) => p.type === 'video' || p.contentType === 'video');
    allPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const interestedPitches = await Promise.all(
      allPosts.slice(0, 10).map(async (post) => {
        const author = post.authorId ? await getById('users', post.authorId) : null;
        const startup = post.startupId ? await getById('startups', post.startupId) : null;
        return {
          ...post,
          authorId: author ? { id: author.id, name: author.name || author.fullName } : post.authorId,
          startupId: startup ? { id: startup.id, name: startup.name } : post.startupId
        };
      })
    );

    res.status(200).json({ success: true, data: { savedStartups, interestedPitches } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getById('users', userId);

    const postsCreatedCount = (await filter('posts', (p) => p.authorId === userId)).length;
    const startupsFollowedCount = (await filter('startups', (s) => (s.followers || []).includes(userId))).length;
    const productsSavedCount = user.savedPosts ? user.savedPosts.length : 0;
    const investorConnectionsCount = (
      await filter('investmentRequests', (r) => r.status === 'accepted' && (r.founderId === userId || r.investorId === userId))
    ).length;

    const analytics = {
      postsCreated: postsCreatedCount,
      startupsFollowed: startupsFollowedCount,
      productsSaved: productsSavedCount,
      investorConnections: investorConnectionsCount,
      founderScore: user.founderScore || 50,
      profileViews: user.profileViews ? user.profileViews.length : 0
    };

    const followingIds = [...(user.following || []), userId];
    let rawFeed = await filter('posts', (p) => followingIds.includes(p.authorId) || p.accessLevel === 'public');
    rawFeed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    rawFeed = rawFeed.slice(0, 10);

    const activityFeed = await Promise.all(
      rawFeed.map(async (post) => {
        const author = post.authorId ? await getById('users', post.authorId) : null;
        const startup = post.startupId ? await getById('startups', post.startupId) : null;
        return {
          ...post,
          authorId: author
            ? { id: author.id, name: author.name || author.fullName, username: author.username, profileImage: author.profileImage }
            : post.authorId,
          startupId: startup ? { id: startup.id, name: startup.name, logo: startup.logo, oneLinePitch: startup.oneLinePitch } : post.startupId
        };
      })
    );

    const notifications = await filter('notifications', (n) => n.recipient === userId);
    notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.status(200).json({
      success: true,
      data: { analytics, activityFeed, notifications: notifications.slice(0, 20) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const users = await getAll('users');
    const startups = await getAll('startups');
    const posts = await getAll('posts');
    const reports = await filter('reports', (r) => r.status === 'Pending' || r.status === 'pending');

    res.status(200).json({
      success: true,
      data: {
        totalUsers: users.length,
        totalStartups: startups.length,
        totalPosts: posts.length,
        pendingReports: reports.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
