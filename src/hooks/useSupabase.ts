import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Book, User, Wishlist, BookSwap, StudyGroup, StudySession } from '../lib/supabase';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          seller:users(
            id,
            email,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }
      
      setBooks(data || []);
    } catch (err) {
      console.error('Error in fetchBooks:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }

  async function addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Adding book:', book);

      // Validate required fields
      if (!book.title?.trim()) throw new Error('Book title is required');
      if (!book.author?.trim()) throw new Error('Author is required');
      if (!book.category) throw new Error('Category is required');
      if (!book.condition) throw new Error('Condition is required');
      if (!book.price || book.price <= 0) throw new Error('Valid price is required');
      if (!book.seller_id) throw new Error('Seller ID is required');

      // Verify user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', book.seller_id)
        .single();

      if (userError || !userData) {
        throw new Error('User profile not found. Please complete your profile first.');
      }

      const { data, error } = await supabase
        .from('books')
        .insert([{
          title: book.title.trim(),
          author: book.author.trim(),
          category: book.category,
          condition: book.condition,
          price: book.price,
          description: book.description?.trim() || null,
          image_url: book.image_url || null,
          seller_id: book.seller_id,
          status: book.status || 'available'
        }])
        .select(`
          *,
          seller:users(
            id,
            email,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error adding book:', error);
        
        // Handle specific database errors
        if (error.code === '23503') {
          throw new Error('User profile not found. Please complete your profile first.');
        } else if (error.code === '42501') {
          throw new Error('Permission denied. Please sign in again.');
        } else if (error.code === '23505') {
          throw new Error('A book with similar details already exists.');
        } else {
          throw new Error(`Failed to create book listing: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('Book was created but no data was returned');
      }

      console.log('Book added successfully:', data);
      setBooks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error in addBook:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateBook(id: string, updates: Partial<Book>) {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          seller:users(
            id,
            email,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error updating book:', error);
        throw error;
      }
      
      setBooks(prev => prev.map(book => book.id === id ? data : book));
      return data;
    } catch (err) {
      console.error('Error in updateBook:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function deleteBook(id: string) {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting book:', error);
        throw error;
      }
      
      setBooks(prev => prev.filter(book => book.id !== id));
    } catch (err) {
      console.error('Error in deleteBook:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function incrementBookView(bookId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('book_views')
        .insert([{
          book_id: bookId,
          viewer_id: user.user.id
        }]);

      if (error && error.code !== '23505') {
        console.error('Error incrementing book view:', error);
      }
    } catch (err) {
      console.error('Error in incrementBookView:', err);
    }
  }

  async function toggleBookLike(bookId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: existingLike, error: fetchError } = await supabase
        .from('book_likes')
        .select()
        .eq('book_id', bookId)
        .eq('user_id', user.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing like:', fetchError);
        throw fetchError;
      }

      if (existingLike) {
        const { error } = await supabase
          .from('book_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) {
          console.error('Error removing like:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('book_likes')
          .insert([{
            book_id: bookId,
            user_id: user.user.id
          }]);

        if (error) {
          console.error('Error adding like:', error);
          throw error;
        }
      }

      await fetchBooks();
    } catch (err) {
      console.error('Error in toggleBookLike:', err);
      throw err;
    }
  }

  return { 
    books, 
    loading, 
    error, 
    fetchBooks, 
    addBook, 
    updateBook,
    deleteBook,
    incrementBookView,
    toggleBookLike
  };
}

export function useUser(userId?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    } else {
      setLoading(false);
    }
  }, [userId]);

  async function fetchUser(id: string) {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        throw error;
      }
      
      setUser(data);
    } catch (err) {
      console.error('Error in fetchUser:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(updates: Partial<User>) {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Updating user with:', updates);

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        
        if (error.code === '23505') {
          if (error.message.includes('username')) {
            throw new Error('Username is already taken');
          } else {
            throw new Error('This information is already in use');
          }
        } else {
          throw new Error(`Failed to update profile: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error('User update succeeded but no data was returned');
      }

      console.log('User updated successfully:', data);
      setUser(data);
      return data;
    } catch (err) {
      console.error('Error in updateUser:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function checkUsername(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        return true; // Username is available
      }
      return false; // Username is taken
    } catch (err) {
      console.error('Error checking username:', err);
      throw err instanceof Error ? err : new Error('Failed to check username');
    }
  }

  return { user, loading, error, updateUser, checkUsername, fetchUser };
}

export function useMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchMessages(bookId: string) {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('book_id', bookId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      setMessages(data || []);
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(bookId: string, content: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert([{
          book_id: bookId,
          content: content.trim(),
          sender_id: user.user.id
        }]);

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      await fetchMessages(bookId);
    } catch (err) {
      console.error('Error in sendMessage:', err);
      throw err instanceof Error ? err : new Error('Failed to send message');
    }
  }

  return { messages, loading, error, fetchMessages, sendMessage };
}

export function useFriends() {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  async function fetchFriends() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setFriends([]);
        return;
      }

      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend:users!friends_friend_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', user.user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        throw error;
      }
      
      setFriends(data || []);
    } catch (err) {
      console.error('Error in fetchFriends:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers(query: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error in searchUsers:', err);
      throw err instanceof Error ? err : new Error('Failed to search users');
    }
  }

  async function sendFriendRequest(friendId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('friends')
        .insert([{
          user_id: user.user.id,
          friend_id: friendId,
          status: 'pending'
        }]);

      if (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }
      
      await fetchFriends();
    } catch (err) {
      console.error('Error in sendFriendRequest:', err);
      throw err instanceof Error ? err : new Error('Failed to send friend request');
    }
  }

  return { friends, loading, error, fetchFriends, searchUsers, sendFriendRequest };
}