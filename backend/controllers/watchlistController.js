const { getById, create, deleteById, findOneByFields, filter, count } = require('../utils/firebaseHelpers');

exports.addToWatchlist = async (req, res) => {
  try {
    const { startupId } = req.body;
    const investorId = req.user.id;

    const startup = await getById('startups', startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const existing = await findOneByFields('watchlists', { investorId, startupId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Startup already in watchlist' });
    }

    const watchlistItem = await create('watchlists', { investorId, startupId });

    res.status(201).json({ success: true, data: watchlistItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { startupId } = req.params;
    const investorId = req.user.id;

    const item = await findOneByFields('watchlists', { investorId, startupId });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Startup not in watchlist' });
    }

    await deleteById('watchlists', item.id);
    res.status(200).json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const investorId = req.user.id;
    const watchlist = await filter('watchlists', (w) => w.investorId === investorId);
    watchlist.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const startups = (await Promise.all(watchlist.map((item) => getById('startups', item.startupId)))).filter(Boolean);

    res.status(200).json({ success: true, data: startups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.checkWatchlist = async (req, res) => {
  try {
    const { startupId } = req.params;
    const investorId = req.user.id;
    const exists = await findOneByFields('watchlists', { investorId, startupId });

    res.status(200).json({ success: true, data: { isSaved: !!exists } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getWatchlistCount = async (req, res) => {
  try {
    const investorId = req.user.id;
    const watchlistCount = await count('watchlists', (w) => w.investorId === investorId);

    res.status(200).json({ success: true, data: { count: watchlistCount } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
