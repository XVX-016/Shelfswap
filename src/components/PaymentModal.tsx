import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Wallet, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookTitle: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentModal = ({ isOpen, onClose, amount, bookTitle }: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'ShelfSwap',
        description: `Payment for ${bookTitle}`,
        handler: function (response: any) {
          toast.success('Payment successful!');
          onClose();
        },
        prefill: {
          name: 'John Doe',
          email: 'john@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#85acc0',
        },
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Complete Purchase</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-gray-600">Book</span>
                <span className="font-medium">{bookTitle}</span>
              </div>

              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-gray-600">Amount</span>
                <span className="text-xl font-bold">₹{amount}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield size={16} className="text-green-500" />
                  <span>100% Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={16} className="text-blue-500" />
                  <span>Credit/Debit Cards, UPI, Netbanking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Wallet size={16} className="text-purple-500" />
                  <span>Wallet Support</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-b-lg">
              <button
                onClick={handlePayment}
                disabled={loading}
                className="ghibli-button w-full"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;