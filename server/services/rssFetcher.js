// services/rssFetcher.js
import Parser from "rss-parser";
import News from "../models/News.js";

const parser = new Parser();

const RSS_SOURCES = [
  { url: "https://feeds.bbci.co.uk/news/rss.xml", source: "BBC" },
  { url: "https://rss.cnn.com/rss/edition.rss", source: "CNN" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" }
];

export const fetchRSSNews = async () => {
  for (const feedSource of RSS_SOURCES) {
    const feed = await parser.parseURL(feedSource.url);

    for (const item of feed.items) {
      const exists = await News.findOne({ link: item.link });
      if (exists) continue;

      await News.create({
        title: item.title,
        description: item.contentSnippet,
        image: item.enclosure?.url || "",
        link: item.link,
        source: feedSource.source,
        publishedAt: item.pubDate
      });
    }
  }

  console.log("✅ Daily news updated");
};
