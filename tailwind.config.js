/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  // আপনার সোর্স ফাইলগুলো কোথায় আছে, তা এখানে উল্লেখ করুন
  // উদাহরণস্বরূপ:
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // extend সেকশনে ডিফল্ট থিম কাস্টমাইজ করুন
    extend: {
      fontFamily: {
        // 'sans' হল ডিফল্ট স্যানস-সেরিফ ফন্ট। Inter-কে প্রথম অপশন হিসেবে সেট করা হলো।
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      // এখানে অন্যান্য কাস্টম কালার, স্পেসিং ইত্যাদি যোগ করা যেতে পারে
    },
  },
  plugins: [],
}


