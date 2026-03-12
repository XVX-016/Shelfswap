import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Search, Image as ImageIcon } from 'lucide-react';
import { useMessages } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookId = location.state?.bookId;
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const { messages, loading, sendMessage, fetchMessages } = useMessages();
  const [messageInput, setMessageInput] = useState('');
  const { user } = useAuth();
  
  useEffect(() => {
    if (bookId) {
      setSelectedBook({
        id: bookId,
        title: "NCERT Physics Class 12",
        image_url: "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=800&q=80",
        price: 299
      });
      fetchMessages(bookId);
    }
  }, [bookId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedBook) return;

    try {
      await sendMessage(selectedBook.id, messageInput.trim());
      setMessageInput('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const displayMessages = messages.length > 0 ? messages : [
    {
      id: 1,
      sender_id: 'seller123',
      content: "Hi! I am interested in your book. Is it still available?",
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 2,
      sender_id: user?.id,
      content: "Yes, it is available! The book is in great condition.",
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  if (!bookId && !selectedBook) {
    navigate('/marketplace');
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-white">
      <div className="h-full flex">
        {/* Book List */}
        <div className="w-1/3 border-r border-gray-200">
          <div className="p-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-gray-200 focus:border-[--color-ghibli-blue] focus:outline-none"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="space-y-2">
              {selectedBook && (
                <div className="p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedBook.image_url}
                      alt={selectedBook.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-medium">{selectedBook.title}</h3>
                      <p className="text-sm text-gray-500">₹{selectedBook.price}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedBook ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBook.image_url}
                    alt={selectedBook.title}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="font-semibold">{selectedBook.title}</h2>
                    <p className="text-sm text-gray-500">₹{selectedBook.price}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center">
                    <div className="loading-sprite"></div>
                  </div>
                ) : (
                  displayMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-[70%] ${
                          message.sender_id === user?.id
                            ? 'bg-[--color-ghibli-blue] text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{message.content}</p>
                        <span className={`text-xs ${
                          message.sender_id === user?.id ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {format(new Date(message.created_at), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ImageIcon size={20} />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-full border-2 border-gray-200 focus:border-[--color-ghibli-blue] focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="ghibli-button !p-3"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;