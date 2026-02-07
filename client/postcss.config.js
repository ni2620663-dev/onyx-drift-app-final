export default {
  plugins: {
    // লক্ষ্য করুন: এখানে 'postcss-nesting' আলাদাভাবে প্রয়োজন নেই কারণ 
    // '@tailwindcss/postcss' নিজেই নেস্টিং সাপোর্ট করে।
    '@tailwindcss/postcss': {}, 
    'autoprefixer': {},
  }
}