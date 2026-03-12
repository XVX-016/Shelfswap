import { motion } from 'framer-motion';
import { Search, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import TrendingBooks from './TrendingBooks';
import { BOOK_CATEGORIES } from '../lib/supabase';

const Hero = () => {
  const floatingBooks = [
    { delay: 0, x: '10%', y: '20%', rotate: 15 },
    { delay: 0.2, x: '80%', y: '15%', rotate: -10 },
    { delay: 0.4, x: '20%', y: '70%', rotate: 5 },
    { delay: 0.6, x: '70%', y: '60%', rotate: -15 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#2c4a6b] via-[#85acc0] to-[#faf3e0]">
      {/* Animated stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ opacity: 1 }}
          animate={{
            opacity: [0.7, 1, 0.7],
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

      {/* Floating books */}
      {floatingBooks.map((book, index) => (
        <motion.div
          key={index}
          className="absolute hidden md:block"
          initial={{ opacity: 0, x: book.x, y: '-100%', rotate: book.rotate }}
          animate={{
            opacity: 1,
            y: book.y,
            transition: {
              delay: book.delay,
              duration: 2,
              type: 'spring',
              stiffness: 50,
            },
          }}
        >
          <div className="relative w-32 h-40 bg-white rounded-lg shadow-xl transform rotate-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f8b4b4] to-[#85acc0] opacity-30" />
            <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-600/50" size={32} />
          </div>
        </motion.div>
      ))}

      {/* Main content */}
      <div className="container mx-auto px-4 pt-32 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Welcome to ShelfSwap
          </h1>
          <div className="mb-12">
            <p className="text-lg md:text-xl text-white/90 font-bold">
              For the learners, by the learners
            </p>
            <p className="text-lg md:text-xl text-white/90">
              Buy and sell used academic books to save and earn money!
            </p>
          </div>

          {/* Broomstick search bar */}
          <motion.div
            className="max-w-2xl mx-auto relative"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative group">
              <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 w-12 h-4 bg-[#8b4513] rounded-l-full opacity-80" />
              <input
                type="text"
                placeholder="Search for books (e.g., NCERT Physics Class 12)"
                className="w-full pl-6 pr-12 py-4 bg-white/90 backdrop-blur-sm rounded-full border-2 border-white/20 focus:outline-none focus:border-white/40 transition-all duration-300 shadow-xl"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Search className="text-gray-600" size={20} />
              </div>
              <motion.div
                className="absolute -left-8 bottom-0 w-2 h-16 bg-[#8b4513] origin-bottom opacity-80"
                animate={{ rotateZ: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Category cards section */}
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">Browse by Category</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {BOOK_CATEGORIES.slice(0, 8).map((category, index) => (
                <Link
                  key={category}
                  to="/marketplace"
                  className="w-56 h-48 bg-white rounded-xl shadow-md border-4 border-orange-400 flex flex-col items-center justify-center p-6 transition-transform hover:scale-105 hover:shadow-xl"
                >
                  <BookOpen className="text-orange-500 mb-4" size={36} />
                  <div className="font-bold text-lg text-gray-900 mb-2">{category}</div>
                  <div className="text-gray-600 text-sm text-center">
                    {category === 'Engineering' && 'Books for engineering courses and entrance exams'}
                    {category === 'Medical' && 'Books for medical studies and entrance exams'}
                    {category === 'Law' && 'Books for law studies and entrance exams'}
                    {category === 'Business' && 'Books for business studies, MBA, and management'}
                    {category === 'Competitive Exams' && 'Books for various competitive examinations'}
                    {/* Add more descriptions as needed */}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Featured Books Section */}
      <div className="container mx-auto px-4 py-16">
        <TrendingBooks />
      </div>

      {/* About ShelfSwap Section */}
      <div className="relative w-full mt-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1500&q=80"
            alt="Bookshelf background"
            className="w-full h-full object-cover object-center opacity-70 blur-sm"
          />
          <div className="absolute inset-0 bg-[#2c4a6b]/80" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center drop-shadow-lg">About ShelfSwap</h2>
          <p className="text-lg md:text-xl text-white/90 text-center max-w-2xl mx-auto">
            Revolutionizing how students access academic books in India through<br />
            a sustainable, student-powered marketplace
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;