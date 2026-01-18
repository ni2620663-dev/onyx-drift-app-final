import React, { useEffect, useState } from "react";
import { fetchNews } from "../services/newsApi";
import NewsCard from "../components/NewsCard";

const News = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews()
      .then(data => {
        setNewsList(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading news...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <h1 className="text-2xl font-extrabold text-white mb-4">
        📰 Daily News
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {newsList.map(news => (
          <NewsCard key={news._id} news={news} />
        ))}
      </div>
    </div>
  );
};

export default News;
