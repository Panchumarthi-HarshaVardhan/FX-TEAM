'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect } from 'react';
import { X, ShoppingBag, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export default function CheckoutModal({ product, items, isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('select');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservationId, setReservationId] = useState(null); // For single
  const [reservationIds, setReservationIds] = useState([]); // For batch
  const [availableStock, setAvailableStock] = useState(0);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    zipCode: '',
    country: ''
  });

  const isCart = items && items.length > 0;
  const cartItems = isCart ? items : (product ? [{ product, quantity }] : []);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setQuantity(1);
      setError('');
      setLoading(false);
      setReservationId(null);
      setReservationIds([]);
      if (product) {
        setAvailableStock(product.stock - (product.reservedStock || 0));
      }
      setShippingAddress({
        street: '',
        city: '',
        zipCode: '',
        country: ''
      });
    }
  }, [isOpen, product, items]);

  const handleClose = async () => {
    // Release stock if reserved but not paid
    if (step === 'payment') {
      try {
        const token = localStorage.getItem('token');
        const idsToRelease = isCart ? reservationIds : (reservationId ? [reservationId] : []);
        
        // Release sequentially or create batch release (for now loop)
        for (const id of idsToRelease) {
            await fetch(`${API_URL}/api/orders/release`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reservationId: id })
            });
        }
      } catch (err) {
        console.error('Failed to release stock', err);
      }
    }
    onClose();
  };

  const handleLockStock = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      let url, body;
      
      if (isCart) {
          url = `${API_URL}/api/orders/lock-batch`;
          body = { items: items.map(i => ({ productId: i.product._id, quantity: i.quantity })) };
      } else {
          url = `${API_URL}/api/orders/lock`;
          body = { productId: product._id, quantity };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (data.success) {
        if (isCart) {
            setReservationIds(data.data.reservations.map(r => r._id));
        } else {
            setReservationId(data.data.reservationId);
        }
        setStep('payment');
      } else {
        setError(data.error || 'Failed to reserve stock');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (
      !shippingAddress.street.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.zipCode.trim() ||
      !shippingAddress.country.trim()
    ) {
      setError('Please fill in all shipping address fields');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationId: !isCart ? reservationId : undefined,
          reservationIds: isCart ? reservationIds : undefined,
          shippingAddress
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setStep('success');
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err) {
      setError('Payment error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate Total
  const totalAmount = isCart 
    ? items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    : (product ? product.price * quantity : 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-heading flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
            Checkout
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Product Summary */}
          <div className="mb-6 bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            {isCart ? (
                cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-center mb-2 last:mb-0 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                        {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.name} className="h-10 w-10 rounded object-cover mr-3" />
                        )}
                        <div className="flex-1">
                        <p className="font-bold text-sm text-heading line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-primary font-bold text-sm">${item.product.price * item.quantity}</p>
                    </div>
                ))
            ) : product ? (
                <div className="flex items-center">
                    {product.images?.[0] && (
                    <img src={product.images[0]} alt={product.name} className="h-12 w-12 rounded object-cover mr-3" />
                    )}
                    <div>
                    <p className="font-bold text-sm text-heading">{product.name}</p>
                    <p className="text-primary font-bold">${product.price}</p>
                    </div>
                </div>
            ) : null}
          </div>

          {step === 'select' && (
            <>
              {!isCart && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {availableStock > 0 ? `${availableStock} items available` : 'Out of stock'}
                </p>
              </div>
              )}

              <div className="mb-6 flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>${isCart ? totalAmount : (product ? product.price * quantity : 0)}</span>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <button
                onClick={handleLockStock}
                disabled={loading || (!isCart && availableStock <= 0)}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Proceed to Payment'}
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <div className="mb-6 space-y-3">
                <div className="space-y-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Street address</label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, street: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="123 Founder Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({ ...prev, city: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ZIP / Postal code</label>
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({ ...prev, zipCode: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="94000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({ ...prev, country: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 border border-blue-100 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800 font-medium">Stock reserved for 10:00</p>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">${totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-bold">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3 mt-3">
                  <span>Total</span>
                  <span>${totalAmount}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex justify-center items-center"
                >
                    {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                    <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay Now
                    </>
                    )}
                </button>
                <button
                    onClick={handleClose}
                    disabled={loading}
                    className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                    Cancel
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold text-heading mb-2">Order Confirmed!</h4>
              <p className="text-gray-500 mb-6">Your order has been placed successfully.</p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 text-heading font-bold rounded-xl hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
