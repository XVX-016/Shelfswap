import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../hooks/useSupabase';
import toast from 'react-hot-toast';
import { BOOK_CATEGORIES, BOOK_TAGS } from '../lib/supabase';

const conditions = ['New', 'Good', 'Fair'];

interface FormErrors {
  title?: string;
  author?: string;
  category?: string;
  condition?: string;
  price?: string;
  description?: string;
}

const SellBook = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBook } = useBooks();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    condition: '',
    price: '',
    description: '',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Get available tags based on selected category
  const availableTags = useMemo(() => {
    if (!formData.category) return [] as string[];
    if (formData.category === 'Competitive Exams') {
      // Flatten all competitive exam tags into a single array
      return Object.values(BOOK_TAGS['Competitive Exams']).flat() as string[];
    }
    return (BOOK_TAGS[formData.category as keyof typeof BOOK_TAGS] || []) as string[];
  }, [formData.category]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Book title is required';
        if (value.trim().length < 2) return 'Title must be at least 2 characters';
        if (value.trim().length > 100) return 'Title must be less than 100 characters';
        break;
      case 'author':
        if (!value.trim()) return 'Author/Publication is required';
        if (value.trim().length < 2) return 'Author must be at least 2 characters';
        if (value.trim().length > 50) return 'Author must be less than 50 characters';
        break;
      case 'category':
        if (!value) return 'Category is required';
        if (!BOOK_CATEGORIES.includes(value)) return 'Please select a valid category';
        break;
      case 'condition':
        if (!value) return 'Condition is required';
        if (!conditions.includes(value)) return 'Please select a valid condition';
        break;
      case 'price':
        if (!value) return 'Price is required';
        const price = parseInt(value);
        if (isNaN(price) || price <= 0) return 'Price must be a positive number';
        if (price > 100000) return 'Price must be less than ₹1,00,000';
        break;
      case 'description':
        if (value && value.length > 500) return 'Description must be less than 500 characters';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImageUrls = validFiles.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...validFiles]);
    setImageUrls(prev => [...prev, ...newImageUrls]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageUrls[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Validate field on blur if it's been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    try {
      setUploadingImages(true);
      const uploadPromises = images.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}_${index}.${fileExt}`;
        const filePath = `book-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('books')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.warn('Storage upload failed, using placeholder:', uploadError);
          return 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=800&q=80';
        }

        const { data: { publicUrl } } = supabase.storage
          .from('books')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      return Promise.all(uploadPromises);
    } catch (error) {
      console.warn('Error uploading images, using placeholders:', error);
      return images.map(() => 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=800&q=80');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to sell books');
      navigate('/auth');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category,
        condition: formData.condition,
        price: parseInt(formData.price),
        description: formData.description || undefined,
        image_url: imageUrls[0] || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=800&q=80',
        seller_id: user.id,
        status: 'available' as const,
        tags: selectedTags.length > 0 ? selectedTags : undefined
      };

      await addBook(bookData);
      toast.success('Book listed successfully!');
      navigate('/marketplace');
    } catch (error) {
      console.error('Error listing book:', error);
      toast.error('Failed to list book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: keyof FormErrors) => {
    return touched[field] ? errors[field] : undefined;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#2c4a6b] via-[#85acc0] to-[#faf3e0] pt-20">
      {/* Animated stars like Hero */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ opacity: 1, scale: 1 }}
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
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[80vh] relative z-10">
        <div
          className="max-w-2xl w-full mx-auto bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">List Your Book</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Book Images</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={url} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Book ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-[--color-ghibli-blue] transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      multiple
                      disabled={uploadingImages}
                    />
                    {uploadingImages ? (
                      <div className="loading-sprite"></div>
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Upload</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500">Upload up to 5 images (max 10MB each, optional)</p>
            </div>

            {/* Book Details */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Book Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`ghibli-input mt-1 ${getFieldError('title') ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="e.g., NCERT Physics Class 12"
                  required
                />
                {getFieldError('title') && (
                  <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>{getFieldError('title')}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                  Author/Publication *
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`ghibli-input mt-1 ${getFieldError('author') ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="e.g., NCERT"
                  required
                />
                {getFieldError('author') && (
                  <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>{getFieldError('author')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`ghibli-input mt-1 ${getFieldError('category') ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                  >
                    <option value="">Select Category</option>
                    {BOOK_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {getFieldError('category') && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      <span>{getFieldError('category')}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`ghibli-input mt-1 ${getFieldError('condition') ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                  >
                    <option value="">Select Condition</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                  {getFieldError('condition') && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      <span>{getFieldError('condition')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  min="1"
                  max="100000"
                  step="1"
                  className={`ghibli-input mt-1 ${getFieldError('price') ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="e.g., 299"
                  required
                />
                {getFieldError('price') && (
                  <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>{getFieldError('price')}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows={4}
                  maxLength={500}
                  className={`ghibli-input mt-1 ${getFieldError('description') ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Describe the condition, any highlights, or notes about your book..."
                />
                <div className="mt-1 flex justify-between items-center">
                  {getFieldError('description') ? (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      <span>{getFieldError('description')}</span>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <span className="text-sm text-gray-500">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Tags Selection */}
              {formData.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
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
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="ghibli-button w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {uploadingImages ? 'Uploading Images...' : 'Listing Book...'}
                </>
              ) : (
                <>
                  <Camera size={20} className="mr-2" />
                  List Book
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellBook;