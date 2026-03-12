import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, CreditCard, Shield } from 'lucide-react';
import { useCart } from './CartContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart = ({ isOpen, onClose }: CartProps) => {
  const { state, dispatch } = useCart();

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    toast.success('Item removed from cart');
  };

  const calculateTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50"
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ShoppingCart size={24} />
                  Cart ({state.items.length})
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {state.items.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Your cart is empty
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-20 w-20 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-[--color-ghibli-blue] font-bold">
                            ₹{item.price}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="rounded-full p-1 hover:bg-gray-100"
                            >
                              <Minus size={16} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="rounded-full p-1 hover:bg-gray-100"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-auto text-red-500 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {state.items.length > 0 && (
                <div className="border-t p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{calculateTotal()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                  </div>

                  <Link
                    to="/cart"
                    onClick={onClose}
                    className="ghibli-button w-full flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    Checkout (₹{calculateTotal()})
                  </Link>

                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Shield size={16} />
                    <span>Secure Checkout</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Cart;