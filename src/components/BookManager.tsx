import React, { useEffect, useState } from 'react';
import { useBooks } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { Book } from '../lib/supabase';
import { BOOK_CATEGORIES } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BookManagerProps {
  onEditBook?: (book: Book) => void;
  onCreateBook?: () => void;
}

const BOOKS_PER_PAGE = 6;
const STATUS_OPTIONS = ['All', 'available', 'sold', 'reserved'];

const BookManager: React.FC<BookManagerProps> = ({ onEditBook, onCreateBook }) => {
  const { user } = useAuth();
  const { books, deleteBook, loading, fetchBooks } = useBooks();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user) {
      setMyBooks(books.filter(book => book.seller_id === user.id));
    } else {
      setMyBooks([]);
    }
  }, [books, user]);

  // Filter and search logic
  const filteredBooks = myBooks.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || book.category === category;
    const matchesStatus = status === 'All' || book.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = filteredBooks.slice(
    (page - 1) * BOOKS_PER_PAGE,
    page * BOOKS_PER_PAGE
  );

  useEffect(() => {
    setPage(1); // Reset to first page on filter/search change
  }, [search, category, status]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await deleteBook(id);
      toast.success('Book deleted');
      fetchBooks();
    } catch (error) {
      toast.error('Failed to delete book');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">My Book Listings</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by title or author"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ghibli-input px-3 py-2"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="ghibli-input px-3 py-2"
          >
            <option value="All">All Categories</option>
            {BOOK_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="ghibli-input px-3 py-2"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
          {onCreateBook && (
            <button onClick={onCreateBook} className="ghibli-button">List a New Book</button>
          )}
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : filteredBooks.length === 0 ? (
        <div>No books found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedBooks.map(book => (
              <div key={book.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                <img src={book.image_url || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=400&q=80'} alt={book.title} className="w-full h-40 object-cover rounded mb-2" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{book.title}</h3>
                  <p className="text-gray-600">by {book.author}</p>
                  <p className="text-gray-500 text-sm">Category: {book.category}</p>
                  <p className="text-gray-500 text-sm">Condition: {book.condition}</p>
                  <p className="text-gray-800 font-bold mt-2">₹{book.price}</p>
                  <p className="text-xs text-gray-400 mt-1">Status: {book.status}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  {onEditBook && (
                    <button onClick={() => onEditBook(book)} className="ghibli-button px-3 py-1">Edit</button>
                  )}
                  <button onClick={() => handleDelete(book.id)} className="ghibli-button bg-red-500 hover:bg-red-600 text-white px-3 py-1">Delete</button>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="ghibli-button px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 flex items-center">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="ghibli-button px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookManager; 