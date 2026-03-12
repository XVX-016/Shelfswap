# 📚 ShelfSwap

### *A High-End Visualization of an Academic Book Marketplace*

ShelfSwap is a premium, Ghibli-inspired marketplace designed for students to buy, sell, and swap used academic books. It combines modern functionality with a serene, whimsical aesthetic to revolutionize how learners access educational resources.

---

## ✨ Design Philosophy & Purpose

This project is a **high-end visualization** of what a modern, sustainable book marketplace can be. It leverages:
- **Vibrant Ghibli-Inspired Aesthetics**: Soft colors, round corners, and smooth micro-animations.
- **Dynamic Interaction**: Powered by Framer Motion for a landing experience that feels "alive."
- **Student-Centric Flow**: From quick search to seamless selling, every interaction is optimized for learners.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS with custom Ghibli theme tokens
- **Animations**: Framer Motion
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Razorpay Integrated (Visualization)
- **Icons**: Lucide React

---

## 🚀 Key Features

- 🔍 **Smart Search**: Filter books by category, condition, and price in real-time.
- 👤 **Dynamic Profiles**: Manage listings, track stats, and customize user data.
- 💬 **Seller Chat**: Direct communication between buyers and sellers.
- 🛍️ **Cart Management**: Seamless flow for adding and managing book selections.
- 🌙 **Modern UX**: Responsive design with focus on premium visual excellence.

---

## 🔧 Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/XVX-016/Shelfswap.git
   ```
2. **Install dependencies**:
   ```bash
   cd project
   npm install
   ```
3. **Environment Configuration**:
   Create a `.env` file in the `project` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## ⚠️ Important Note on CORS
If you encounter **CORS errors** (Cross-Origin Request Blocked) when connecting to Supabase:
1. Open your **Supabase Dashboard**.
2. Go to **Authentication** > **URL Configuration**.
3. Add `http://localhost:5173` to the **Allowed Redirect URLs**.
4. Ensure your local origin is permitted in the Site URL settings.

---

*For the learners, by the learners.* 🌟
