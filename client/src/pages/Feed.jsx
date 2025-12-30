import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import SkeletonLoader from "../components/SkeletonLoader"; // আগের তৈরি করা স্কেলিটন

const Feed = () => {
  const [items, setItems] = useState([]); // পোস্ট লিস্ট
  const [hasMore, setHasMore] = useState(true); // আরও ডাটা আছে কি না
  const [page, setPage] = useState(1); // বর্তমান পেজ নম্বর

  // ডাটাবেজ থেকে ডাটা নিয়ে আসার ফাংশন
  const fetchMoreData = async () => {
    try {
      // আপনার ব্যাকএন্ড API এন্ডপয়েন্ট (Pagination সহ)
      const res = await fetch(`http://localhost:10000/api/posts?page=${page}&limit=5`);
      const data = await res.json();

      if (data.length === 0) {
        setHasMore(false); // যদি আর কোনো পোস্ট না থাকে
        return;
      }

      setItems([...items, ...data]); // আগের পোস্টের সাথে নতুনগুলো যোগ করা
      setPage(page + 1); // পরের বার পরবর্তী পেজের জন্য সেট করা
    } catch (error) {
      console.error("Error fetching posts:", error);
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchMoreData(); // প্রথমবার পেজ লোড হলে কল হবে
  }, []);
  await Post.findByIdAndDelete(req.params.id); 
res.json({ msg: 'Post removed' });

  return (
    <div className="max-w-[600px] mx-auto py-5 px-2">
      <InfiniteScroll
        dataLength={items.length}
        next={fetchMoreData} // নিচে স্ক্রল করলে এই ফাংশনটি কল হবে
        hasMore={hasMore}
        loader={<SkeletonLoader />} // লোড হওয়ার সময় স্কেলিটন দেখাবে
        endMessage={
          <p className="text-center text-gray-500 py-5">
            <b>You have seen all posts!</b>
          </p>
        }
      >
        {items.map((post) => (
          <div 
            key={post._id} 
            className="bg-white rounded-xl shadow-sm mb-4 border border-gray-200 overflow-hidden"
          >
            {/* ১. পোস্ট হেডার */}
            <div className="flex items-center gap-3 p-4">
              <img 
                src={post.userAvatar} 
                className="w-10 h-10 rounded-full object-cover" 
                alt="user"
                loading="lazy" // Lazy Loading (ছবি স্ক্রিনে আসলে লোড হবে)
              />
              <div>
                <h4 className="font-bold text-[15px]">{post.userName}</h4>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>

            {/* ২. পোস্ট টেক্সট */}
            <div className="px-4 pb-3">
              <p className="text-[15px] text-gray-800">{post.desc}</p>
            </div>

            {/* ৩. পোস্ট ইমেজ (Lazy Loading সহ) */}
            {post.img && (
              <div className="w-full bg-gray-100">
                <img 
                  src={post.img} 
                  className="w-full h-auto object-cover max-h-[500px]" 
                  alt="post" 
                  loading="lazy" 
                />
              </div>
            )}

            {/* ৪. লাইক/কমেন্ট বাটন */}
            <div className="flex justify-around border-t border-gray-100 p-1">
              <button className="flex-1 py-2 hover:bg-gray-100 text-gray-600 font-semibold text-sm">Like</button>
              <button className="flex-1 py-2 hover:bg-gray-100 text-gray-600 font-semibold text-sm">Comment</button>
              <button className="flex-1 py-2 hover:bg-gray-100 text-gray-600 font-semibold text-sm">Share</button>
            </div>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default Feed;