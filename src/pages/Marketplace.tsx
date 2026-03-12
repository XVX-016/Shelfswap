import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, LogIn, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { useBooks } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { BOOK_CATEGORIES, BOOK_TAGS } from '../lib/supabase';

const categories = ['All', ...BOOK_CATEGORIES];
const conditions = ['All', 'Like New', 'Good', 'Fair'];
const priceRanges = ['All', '0-500', '501-1000', '1001-2000', '2000+'];

const POPULAR_CATEGORIES = BOOK_CATEGORIES.slice(0, 8);

const Marketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const { books, loading } = useBooks();
  const [filteredBooks, setFilteredBooks] = useState(books);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Get available tags based on selected category
  const availableTags = useMemo((): string[] => {
    if (selectedCategory === 'All') {
      // Show all possible tags when no category is selected
      const allTags = new Set<string>();
      Object.values(BOOK_TAGS).forEach(tags => {
        if (Array.isArray(tags)) {
          tags.forEach(tag => allTags.add(tag));
        } else if (typeof tags === 'object') {
          // Handle competitive exams subcategories
          Object.values(tags).forEach(subtags => {
            if (Array.isArray(subtags)) {
              subtags.forEach(tag => allTags.add(tag));
            }
          });
        }
      });
      return Array.from(allTags);
    }
    
    if (selectedCategory === 'Competitive Exams') {
      return Object.values(BOOK_TAGS['Competitive Exams']).flat() as string[];
    }
    
    return (BOOK_TAGS[selectedCategory as keyof typeof BOOK_TAGS] || []) as string[];
  }, [selectedCategory]);

  const visibleTags = showAllTags ? availableTags : availableTags.slice(0, 8);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  useEffect(() => {
    let filtered = books;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(book => 
        book.tags?.some(tag => selectedTags.includes(tag))
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    }
    
    setFilteredBooks(filtered);
  }, [books, selectedCategory, selectedTags, searchQuery]);

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ghibli-input pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ghibli-button !px-4"
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md mb-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select 
                    className="ghibli-input"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedTags([]); // Reset tags when category changes
                    }}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <select className="ghibli-input">
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select className="ghibli-input">
                    {priceRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tags */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {visibleTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-[--color-ghibli-blue] text-white'
                      : 'bg-white/80 text-gray-600 hover:bg-[--color-ghibli-blue]/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {availableTags.length > 8 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-200 hover:bg-gray-300 transition-colors flex items-center gap-1"
                >
                  {showAllTags ? (
                    <>Show Less <ChevronUp size={16} /></>
                  ) : (
                    <>Show More <ChevronDown size={16} /></>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-500">Active filters:</span>
              {selectedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className="px-2 py-1 rounded-full text-xs bg-[--color-ghibli-blue] text-white flex items-center gap-1"
                >
                  {tag}
                  <X size={14} />
                </button>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="px-2 py-1 rounded-full text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-sprite"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No books found</p>
          </div>
        ) : (
          <>
            {!user && (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 flex items-center justify-between">
                <p className="text-gray-600">Sign in to buy books and access more features!</p>
                <Link to="/auth" className="ghibli-button flex items-center gap-2">
                  <LogIn size={20} />
                  Sign In
                </Link>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map(book => (
                <BookCard
                  key={book.id}
                  {...book}
                  id={typeof book.id === 'number' ? book.id : parseInt(book.id, 36) || 0}
                  imageUrl={book.image_url || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=400&q=80'}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;