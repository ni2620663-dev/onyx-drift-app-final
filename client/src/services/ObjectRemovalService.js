export const removeObjectFromVideo = async (videoFile, coordinates, token) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("mask_area", JSON.stringify(coordinates)); // {x, y, width, height}

  try {
    const response = await fetch('https://onyx-drift-app-final-u29m.onrender.com/api/ai/object-removal', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
      body: formData
    });

    const data = await response.json();
    return data.processedVideoUrl; // অবজেক্ট ছাড়া নতুন ভিডিওর লিঙ্ক
  } catch (err) {
    console.error("Neural Inpainting Failed:", err);
    throw new Error("AI Eraser is currently overloaded.");
  }
};