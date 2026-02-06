/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ওনিক্স ড্রিফট থিম কালারস
        'zenith-dark': '#050508',
        'zenith-card': 'rgba(255, 255, 255, 0.05)', 
        'zenith-border': 'rgba(255, 255, 255, 0.1)', 
        'cyan-neon': '#00BFFF', 
        'purple-neon': '#8A2BE2', 
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Fira Code', 'monospace'],
      },
      animation: {
        // কাস্টম অ্যানিমেশনস
        'spin-slow': 'spin 8s linear infinite', // আপনার রিকোয়েস্ট অনুযায়ী ৮ সেকেন্ড করা হয়েছে
        'marquee': 'marquee 10s linear infinite',
        'marquee-text': 'marquee-text 12s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 3s ease infinite', // ল্যান্ডিং পেজ বাটনের জন্য
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-text': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
      boxShadow: {
        // নিওন এবং গ্লাস গ্লো ইফেক্ট
        'glass-light': '0 4px 6px rgba(255, 255, 255, 0.1), 0 1px 3px rgba(255, 255, 255, 0.08)',
        'neon-blue': '0 0 25px rgba(0, 191, 255, 0.6)',
        'neon-purple': '0 0 25px rgba(138, 43, 226, 0.6)',
        'orb-glow': '0 0 50px rgba(0, 191, 255, 0.8), 0 0 30px rgba(138, 43, 226, 0.8)',
        'cyan-glow': '0 0 15px rgba(6, 182, 212, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px', 
      },
    },
  },
  plugins: [
    // স্ক্রলবার হাইড করার জন্য প্লাগইন
    function ({ addUtilities }) {
      addUtilities({
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
}