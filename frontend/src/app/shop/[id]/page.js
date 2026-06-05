'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import CheckoutModal from '../../../components/shop/CheckoutModal';
import { ShoppingBag, ArrowLeft, Heart, Building2, Star, StarHalf, StarOff } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    const storedWishlist = typeof window !== 'undefined' ? localStorage.getItem('fx_wishlist') : null;
    if (storedWishlist) {
      try {
        setWishlistIds(JSON.parse(storedWishlist));
      } catch {
        setWishlistIds([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!params?.id) return;
    fetchProduct(params.id.toString());
  }, [params]);

  const fetchProduct = async (id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:3000/api/products/${id}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response');
      }
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('fx_recently_viewed');
            const list = raw ? JSON.parse(raw) : [];
            const filtered = list.filter((pid) => pid !== data.data._id);
            const updated = [data.data._id, ...filtered].slice(0, 20);
            localStorage.setItem('fx_recently_viewed', JSON.stringify(updated));
          } catch {
          }
        }
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    setWishlistIds((prev) => {
      const exists = prev.includes(product._id);
      const next = exists ? prev.filter((id) => id !== product._id) : [...prev, product._id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('fx_wishlist', JSON.stringify(next));
      }
      return next;
    });
  };

  const addToCart = () => {
    if (!product || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('fx_cart');
      const current = raw ? JSON.parse(raw) : [];
      const existing = current.find((item) => item.productId === product._id);
      const available = product.stock - (product.reservedStock || 0);
      if (available <= 0) {
        return;
      }
      if (existing) {
        if (existing.quantity >= available) {
          return;
        }
        existing.quantity += 1;
      } else {
        current.push({
          productId: product._id,
          product,
          quantity: 1
        });
      }
      localStorage.setItem('fx_cart', JSON.stringify(current));
    } catch {
    }
  };

  const available = useMemo(() => {
    if (!product) return 0;
    return product.stock - (product.reservedStock || 0);
  }, [product]);

  const inWishlist = product && wishlistIds.includes(product._id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 pt-28 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div className="h-80 bg-gray-100 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-10 bg-gray-100 rounded w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-12">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <div className="bg-white border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium">{error || 'Product not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const mainImage = images[activeImageIndex] || images[0] || null;
  const startup = product.startupId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12 space-y-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to shop
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 h-80 flex items-center justify-center">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <ShoppingBag className="h-16 w-16 text-gray-300" />
              )}
              <button
                type="button"
                onClick={toggleWishlist}
                className={`absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center bg-white/90 shadow-sm hover:bg-white ${
                  inWishlist ? 'text-rose-500' : 'text-gray-500'
                }`}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
              {available <= 0 && (
                <span className="absolute bottom-4 left-4 text-xs font-semibold px-2 py-1 rounded-full bg-red-500 text-white">
                  Sold out
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-16 rounded-xl overflow-hidden border ${
                      idx === activeImageIndex ? 'border-primary' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-4">
              <div className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-primary/5 text-primary mb-2">
                <ShoppingBag className="h-3 w-3 mr-1" />
                Startup Product
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{product.description}</p>
              {startup && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{startup.name}</span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-2xl font-bold text-gray-900">${product.price}</p>
                <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {available > 5 ? 'In stock' : available > 0 ? `Only ${available} left` : 'Currently unavailable'}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Star className="h-4 w-4 text-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400" />
                <StarHalf className="h-4 w-4 text-yellow-400" />
                <StarOff className="h-4 w-4 text-gray-300" />
                <span>No reviews yet</span>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button
                type="button"
                onClick={() => {
                  addToCart();
                }}
                disabled={available <= 0}
                className="w-full inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-4 py-3 text-sm font-semibold hover:bg-black transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={() => {
                  if (available <= 0) return;
                  setShowCheckout(true);
                }}
                disabled={available <= 0}
                className="w-full inline-flex items-center justify-center rounded-full border border-gray-900 text-gray-900 px-4 py-3 text-sm font-semibold hover:bg-gray-900 hover:text-white transition disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                Buy now
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Reviews</h2>
          <p className="text-sm text-gray-500 mb-4">
            Reviews from customers will appear here after they purchase this product.
          </p>
          <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-sm text-gray-400 text-center">
            No reviews yet. Be the first to try this product.
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          product={product}
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
