import React from "react";

const NewsCard = ({ news }) => {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-md">
      {news.image && (
        <img
          src={news.image}
          alt={news.title}
          className="w-full h-44 object-cover"
        />
      )}

      <div className="p-4">
        <span className="text-xs text-blue-500 font-bold">
          {news.source}
        </span>

        <h2 className="text-white font-bold mt-1 line-clamp-2">
          {news.title}
        </h2>

        <p className="text-zinc-400 text-sm mt-2 line-clamp-3">
          {news.description}
        </p>

        <a
          href={news.link}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 text-blue-500 text-sm font-semibold"
        >
          Read full news →
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
