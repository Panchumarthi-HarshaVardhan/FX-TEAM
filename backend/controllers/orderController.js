const { getById, create, updateById, filter } = require('../utils/firebaseHelpers');
const { createNotification } = require('../utils/socialHelpers');

const cleanupExpiredReservations = async () => {
  const now = Date.now();
  const expired = await filter('reservations', (r) => r.status === 'active' && r.expiresAt < now);
  for (const reservation of expired) {
    const product = await getById('products', reservation.productId);
    if (product) {
      await updateById('products', reservation.productId, {
        reservedStock: Math.max(0, (product.reservedStock || 0) - reservation.quantity)
      });
    }
    await updateById('reservations', reservation.id, { status: 'cancelled' });
  }
};

const finalizeOrderFromReservation = async (reservation, req) => {
  const product = await getById('products', reservation.productId);
  if (!product) return null;

  const totalAmount = product.price * reservation.quantity;
  const order = await create('orders', {
    userId: req.user.id,
    productId: reservation.productId,
    founderId: product.founderId,
    quantity: reservation.quantity,
    unitPrice: product.price,
    totalAmount,
    status: 'pending',
    shippingAddress: req.body.shippingAddress
  });

  const newStock = (product.stock || 0) - reservation.quantity;
  const newReserved = Math.max(0, (product.reservedStock || 0) - reservation.quantity);
  const finalProduct = await updateById('products', reservation.productId, {
    stock: newStock,
    reservedStock: newReserved
  });

  await updateById('reservations', reservation.id, { status: 'completed' });

  const io = req.app.get('io');
  if (io) {
    io.to(product.founderId).emit('new_order', {
      orderId: order.id,
      productName: product.name,
      quantity: order.quantity
    });
    io.emit('stock_update', {
      productId: product.id,
      availableStock: (finalProduct.stock || 0) - (finalProduct.reservedStock || 0)
    });
  }

  await createNotification(
    {
      recipient: product.founderId,
      sender: req.user.id,
      type: 'order',
      entityId: order.id,
      entityType: 'Order',
      content: `${order.quantity} x ${product.name} for $${totalAmount}`
    },
    io
  );

  return order;
};

exports.lockStock = async (req, res) => {
  try {
    await cleanupExpiredReservations();
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity);
    if (qty <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid quantity' });
    }

    const product = await getById('products', productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (!product.isActive) {
      return res.status(400).json({ success: false, error: 'Product is not available' });
    }

    const availableStock = (product.stock || 0) - (product.reservedStock || 0);
    if (availableStock < qty) {
      return res.status(400).json({ success: false, error: 'Insufficient stock available' });
    }

    const updatedProduct = await updateById('products', productId, {
      reservedStock: (product.reservedStock || 0) + qty
    });

    const reservation = await create('reservations', {
      userId: req.user.id,
      productId,
      quantity: qty,
      expiresAt: Date.now() + 10 * 60 * 1000,
      status: 'active'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('stock_update', {
        productId: product.id,
        availableStock: (updatedProduct.stock || 0) - (updatedProduct.reservedStock || 0)
      });
    }

    res.status(200).json({
      success: true,
      data: { reservationId: reservation.id, expiresAt: reservation.expiresAt }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { reservationId, reservationIds, shippingAddress } = req.body;

    if (reservationIds && Array.isArray(reservationIds) && reservationIds.length > 0) {
      const orders = [];
      for (const resId of reservationIds) {
        const reservation = await getById('reservations', resId);
        if (!reservation || reservation.status !== 'active' || reservation.userId !== req.user.id) continue;
        req.body.shippingAddress = shippingAddress;
        const order = await finalizeOrderFromReservation(reservation, req);
        if (order) orders.push(order);
      }
      return res.status(201).json({ success: true, data: orders });
    }

    const reservation = await getById('reservations', reservationId);
    if (!reservation || reservation.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Reservation expired or invalid' });
    }
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    if (Date.now() > reservation.expiresAt) {
      const product = await getById('products', reservation.productId);
      if (product) {
        await updateById('products', reservation.productId, {
          reservedStock: Math.max(0, (product.reservedStock || 0) - reservation.quantity)
        });
      }
      await updateById('reservations', reservationId, { status: 'cancelled' });
      return res.status(400).json({ success: false, error: 'Reservation expired' });
    }

    const order = await finalizeOrderFromReservation(reservation, req);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.lockStockBatch = async (req, res) => {
  const { items } = req.body;
  const lockedReservations = [];

  try {
    await cleanupExpiredReservations();

    for (const item of items) {
      const qty = parseInt(item.quantity);
      if (qty <= 0) throw new Error(`Invalid quantity for product ${item.productId}`);

      const product = await getById('products', item.productId);
      if (!product || !product.isActive) throw new Error(`Product ${item.productId} unavailable`);

      const availableStock = (product.stock || 0) - (product.reservedStock || 0);
      if (availableStock < qty) throw new Error(`Insufficient stock for ${product.name}`);

      await updateById('products', item.productId, { reservedStock: (product.reservedStock || 0) + qty });

      const reservation = await create('reservations', {
        userId: req.user.id,
        productId: item.productId,
        quantity: qty,
        expiresAt: Date.now() + 10 * 60 * 1000,
        status: 'active'
      });
      lockedReservations.push(reservation);
    }

    res.status(200).json({
      success: true,
      data: {
        reservations: lockedReservations,
        expiresAt: lockedReservations[0]?.expiresAt
      }
    });
  } catch (error) {
    for (const reservation of lockedReservations) {
      const product = await getById('products', reservation.productId);
      if (product) {
        await updateById('products', reservation.productId, {
          reservedStock: Math.max(0, (product.reservedStock || 0) - reservation.quantity)
        });
      }
      await updateById('reservations', reservation.id, { status: 'cancelled' });
    }
    res.status(400).json({ success: false, error: error.message || 'One or more items are out of stock' });
  }
};

exports.releaseStock = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const reservation = await getById('reservations', reservationId);
    if (!reservation || reservation.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Reservation invalid' });
    }
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const product = await getById('products', reservation.productId);
    const updatedProduct = await updateById('products', reservation.productId, {
      reservedStock: Math.max(0, (product.reservedStock || 0) - reservation.quantity)
    });
    await updateById('reservations', reservationId, { status: 'cancelled' });

    const io = req.app.get('io');
    if (io && updatedProduct) {
      io.emit('stock_update', {
        productId: updatedProduct.id,
        availableStock: (updatedProduct.stock || 0) - (updatedProduct.reservedStock || 0)
      });
    }

    res.status(200).json({ success: true, message: 'Stock released' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    let orders = await filter('orders', (o) => o.userId === req.user.id);
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    orders = await Promise.all(
      orders.map(async (order) => {
        const product = order.productId ? await getById('products', order.productId) : null;
        return {
          ...order,
          productId: product ? { id: product.id, name: product.name, price: product.price, images: product.images } : order.productId
        };
      })
    );

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
