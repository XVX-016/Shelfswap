import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import BookCard from './BookCard';

const TrendingBooks = () => {
  const [trendingBooks, setTrendingBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingBooks();
  }, []);

  const fetchTrendingBooks = async () => {
    try {
      setError(null);
      
      // Check if Supabase client is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase environment variables are not configured');
      }

      console.log('Attempting to connect to Supabase:', supabaseUrl);

      // Test basic connectivity first
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          seller:users(
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Successfully fetched books:', data?.length || 0);
      setTrendingBooks(data || []);
    } catch (error: any) {
      console.error('Error fetching trending books:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load trending books';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the database. Please check your internet connection.';
      } else if (error.message?.includes('environment variables')) {
        errorMessage = 'Database configuration error. Please check environment variables.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="loading-sprite"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">Unable to Load Featured Books</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchTrendingBooks}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (trendingBooks.length === 0) {
    return (
      <div className="py-12">
        <div className="text-center text-gray-500">
          <h2 className="text-3xl font-bold mb-4 text-white">Featured Books</h2>
          <p className="text-white/80">No books available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-white">Featured Books</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trendingBooks.map((book) => (
          <BookCard key={book.id} {...book} />
        ))}
      </div>
    </div>
  );
};

export default TrendingBooks;