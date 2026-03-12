import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../hooks/useSupabase';
import toast from 'react-hot-toast';

interface BookCardProps {
  id: number;
  title: string;
  author: string;
  price: number;
  condition: string;
  category: string;
  imageUrl: string;
  seller_id: string;
  tags?: string[];
}

const BookCard = ({ id, title, author, price, condition, category, imageUrl, seller_id, tags }: BookCardProps) => {
  const { dispatch } = useCart();
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incrementBookView, toggleBookLike } = useBooks();

  useEffect(() => {
    if (user) {
      incrementBookView(id.toString());
    }
  }, [id, user]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    dispatch({
      type: 'ADD_ITEM',
      payload: { id, title, price, imageUrl, quantity: 1 },
    });
    toast.success('Added to cart!');
  };

  const handleMessageSeller = () => {
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }
    if (user.id === seller_id) {
      toast.error('This is your book listing');
      return;
    }
    navigate('/chat', { state: { bookId: id } });
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like books');
      return;
    }
    try {
      await toggleBookLike(id.toString());
      setIsLiked(!isLiked);
    } catch (error) {
      toast.error('Failed to like book');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            onClick={handleLike}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Heart
              size={20}
              className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}
            />
          </button>
          <button 
            onClick={handleMessageSeller}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <MessageCircle size={20} className="text-gray-600" />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          <span className="px-2 py-1 bg-[--color-ghibli-blue]/80 text-white text-sm rounded-full">
            {category}
          </span>
          {tags && tags.length > 0 && (
            <span className="px-2 py-1 bg-[--color-ghibli-blue]/60 text-white text-sm rounded-full">
              {tags[0]}{tags.length > 1 ? ` +${tags.length - 1}` : ''}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-2">{author}</p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[--color-ghibli-blue] font-bold">₹{price}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{condition}</span>
            <button
              onClick={handleAddToCart}
              className="p-2 bg-[--color-ghibli-blue] text-white rounded-full hover:bg-[--color-ghibli-blue]/90 transition-colors"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookCard;