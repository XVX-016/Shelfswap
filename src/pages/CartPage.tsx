import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, ArrowLeft } from 'lucide-react';
import { useCart } from '../components/CartContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { state, dispatch } = useCart();
  const [loading, setLoading] = useState(false);

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    toast.success('Item removed from cart');
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: state.total * 100, // Amount in paise
        currency: 'INR',
        name: 'ShelfSwap',
        description: 'Payment for books',
        image: 'https://your-logo-url.png',
        handler: function(response: any) {
          // Handle successful payment
          toast.success('Payment successful!');
          dispatch({ type: 'CLEAR_CART' });
        },
        prefill: {
          name: 'John Doe',
          email: 'john@example.com',
          contact: '9999999999',
        },
        notes: {
          address: 'ShelfSwap Corporate Office'
        },
        theme: {
          color: '#85acc0'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.18); // 18% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link to="/marketplace" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft size={20} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="text-[--color-ghibli-blue]" />
            Your Cart ({state.items.length} items)
          </h1>

          {state.items.length === 0 ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <ShoppingBag size={48} className="mx-auto text-gray-400" />
                <p className="text-gray-500">Your cart is empty</p>
                <Link to="/marketplace" className="ghibli-button inline-block">
                  Browse Books
                </Link>
              </motion.div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {state.items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-24 h-24 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-[--color-ghibli-blue] font-bold">₹{item.price}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{calculateSubtotal()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST (18%)</span>
                      <span>₹{calculateTax()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>₹{calculateTotal()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="ghibli-button w-full mt-6 flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    {loading ? 'Processing...' : 'Proceed to Checkout'}
                  </button>

                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Secure payment powered by Razorpay
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;