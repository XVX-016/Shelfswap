import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './components/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marketplace from './pages/Marketplace';
import SellBook from './pages/SellBook';
// import Friends from './pages/Friends';
// import Chat from './pages/Chat';
// import StudyRoom from './pages/StudyRoom';
import CartPage from './pages/CartPage';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import './styles/ghibli-theme.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="loading-sprite"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen relative"
        >
          {/* Fixed Background */}
          <div className="fixed inset-0 bg-gradient-to-b from-[#2c4a6b] via-[#85acc0] to-[#faf3e0] -z-10">
            {/* Animated stars */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ opacity: 0.2 }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 50}%`,
                }}
              />
            ))}

            {/* Animated clouds */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`cloud-${i}`}
                className="absolute"
                initial={{ x: '-100%', opacity: 0.8 }}
                animate={{
                  x: '100%',
                  opacity: [0.8, 1, 0.8],
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: 'linear',
                  y: {
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatType: 'reverse',
                  },
                }}
                style={{
                  top: `${20 + i * 15}%`,
                  left: `-${100 + i * 50}px`,
                }}
              >
                <div className="w-16 h-8 bg-white/30 rounded-full" />
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            <Navbar />
            <div className="flex pt-16">
              <main className="flex-1 transition-all duration-300">
                <Routes>
                  <Route path="/" element={<Hero />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/sell" element={<ProtectedRoute><SellBook /></ProtectedRoute>} />
                  {/* <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} /> */}
                  {/* <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} /> */}
                  {/* <Route path="/study-room" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} /> */}
                  <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/auth" element={<Auth />} />
                </Routes>
              </main>
            </div>
            <Toaster position="bottom-right" />
          </div>
        </motion.div>
      </AnimatePresence>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;