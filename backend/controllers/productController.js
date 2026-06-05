const { getById, create, updateById, filter } = require('../utils/firebaseHelpers');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, images, startupId, stock, lowStockThreshold, category } = req.body;

    const startup = await getById('startups', startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }
    if (startup.founderId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to add products to this startup' });
    }

    const product = await create('products', {
      founderId: req.user.id,
      startupId,
      name,
      description,
      price,
      images,
      category,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 5,
      isActive: true
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await getById('products', req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (product.founderId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this product' });
    }

    const updated = await updateById('products', req.params.id, { ...req.body, updatedAt: Date.now() });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    let products = await filter('products', (p) => {
      if (req.query.startupId) return p.startupId === req.query.startupId;
      return true;
    });

    products = await Promise.all(
      products.map(async (product) => {
        const startup = product.startupId ? await getById('startups', product.startupId) : null;
        const founder = product.founderId ? await getById('users', product.founderId) : null;
        return {
          ...product,
          startupId: startup ? { id: startup.id, name: startup.name, logo: startup.logo } : product.startupId,
          founderId: founder ? { id: founder.id, name: founder.name || founder.fullName } : product.founderId
        };
      })
    );

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await getById('products', req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const startup = product.startupId ? await getById('startups', product.startupId) : null;
    const founder = product.founderId ? await getById('users', product.founderId) : null;

    res.status(200).json({
      success: true,
      data: {
        ...product,
        startupId: startup ? { id: startup.id, name: startup.name, logo: startup.logo } : product.startupId,
        founderId: founder ? { id: founder.id, name: founder.name || founder.fullName } : product.founderId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
