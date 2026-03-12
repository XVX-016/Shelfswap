import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Home, User, Menu, X, PlusCircle, ShoppingCart, AlignLeft, LogOut, LogIn } from 'lucide-react';
import Cart from './Cart';
import { useCart } from './CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

type NavbarProps = {};

const Navbar = ({}: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useCart();
  const { user, signOut } = useAuth();

  const links = [
    { to: '/', icon: <Home size={20} />, label: 'Home' },
    { to: '/marketplace', icon: <BookOpen size={20} />, label: 'Marketplace' },
    ...(user ? [
      { to: '/sell', icon: <PlusCircle size={20} />, label: 'Sell Book' },
      { to: '/profile', icon: <User size={20} />, label: 'Profile' },
    ] : []),
  ];

  const handleSignOut = async () => {
    console.log('handleSignOut called, user:', user);
    toast('Attempting to sign out...');
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
      console.log('Sign out successful');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error('Sign out error:', error);
    }
    console.log('handleSignOut finished, user:', user);
  };

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-sm border-b border-[--color-ghibli-cream]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="text-[--color-ghibli-blue]" size={24} />
              <span className="text-xl font-bold">ShelfSwap</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors
                  ${location.pathname === link.to 
                    ? 'text-[--color-ghibli-blue] bg-[--color-ghibli-blue]/10' 
                    : 'text-gray-600 hover:text-[--color-ghibli-blue]'
                  }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Cart Button */}
            {user && (
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart size={24} />
                {state.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[--color-ghibli-blue] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {state.items.length}
                  </span>
                )}
              </button>
            )}

            {/* Auth Buttons */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Sign Out"
              >
                <LogOut size={24} />
              </button>
            ) : (
              <Link
                to="/auth"
                className="ghibli-button flex items-center gap-2"
              >
                <LogIn size={20} />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white border-t border-[--color-ghibli-cream]"
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center space-x-2 px-4 py-3
                ${location.pathname === link.to 
                  ? 'text-[--color-ghibli-blue] bg-[--color-ghibli-blue]/10' 
                  : 'text-gray-600'
                }`}
              onClick={() => setIsOpen(false)}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </motion.div>
      )}

      {/* Cart Sidebar */}
      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
    </nav>
  );
}

export default Navbar;