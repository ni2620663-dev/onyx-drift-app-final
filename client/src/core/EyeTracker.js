// ল্যান্ডমার্ক থেকে চোখের কেন্দ্রবিন্দু বের করার ফাংশন
export const getGazePosition = (landmarks, width, height) => {
  // চোখের আইরিসের ল্যান্ডমার্ক (৪৬৮-৪৭৩ এর গড়)
  const leftEye = [468, 469, 470, 471]; 
  
  let x = 0, y = 0;
  leftEye.forEach(index => {
    x += landmarks[index].x;
    y += landmarks[index].y;
  });

  // গড় কোঅর্ডিনেট বের করা
  const gazeX = (x / leftEye.length) * width;
  const gazeY = (y / leftEye.length) * height;

  return { x: gazeX, y: gazeY };
};