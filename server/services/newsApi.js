export const fetchNews = async () => {
  const res = await fetch("https://onyx-drift-app-final.onrender.com/api/news");
  if (!res.ok) throw new Error("Failed to fetch news");
  return res.json();
};
