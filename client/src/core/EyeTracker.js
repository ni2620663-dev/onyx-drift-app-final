/**
 * ল্যান্ডমার্ক থেকে চোখের আইরিস এবং দৃষ্টির অবস্থান (Gaze Position) বের করার ফাংশন
 * @param {Array} landmarks - MediaPipe FaceMesh থেকে প্রাপ্ত ৪৬৮+ ল্যান্ডমার্ক
 * @param {number} width - ভিডিও ফ্রেমের প্রস্থ
 * @param {number} height - ভিডিও ফ্রেমের উচ্চতা
 */
export const getGazePosition = (landmarks, width, height) => {
  if (!landmarks || landmarks.length < 473) return null;

  // ১. আইরিস ল্যান্ডমার্ক ইনডেক্স (MediaPipe Iris Model)
  // বাম চোখের মণি: ৪৬৮ (সেন্টার), ৪৬৯, ৪৭০, ৪৭১, ৪৭২
  // ডান চোখের মণি: ৪৭৩ (সেন্টার), ৪৭৪, ৪৭৫, ৪৭৬, ৪৭৭
  const leftIrisCenter = landmarks[468];
  const rightIrisCenter = landmarks[473];

  // ২. দুই চোখের মণির মধ্যবর্তী গড় অবস্থান বের করা (Binocular Gaze)
  const avgX = (leftIrisCenter.x + rightIrisCenter.x) / 2;
  const avgY = (leftIrisCenter.y + rightIrisCenter.y) / 2;

  // ৩. স্ক্রিন কোঅর্ডিনেটে রূপান্তর (Smoothing প্রয়োগ করা যেতে পারে)
  const gazeX = avgX * width;
  const gazeY = avgY * height;

  /** * ৪. জেসচার বা ইন্টেন্টের জন্য অতিরিক্ত ডাটা (Optional)
   * চোখের পাতার দূরত্ব মেপে আপনি 'Blink' বা 'Stare' ডিটেক্ট করতে পারেন
   */
  const upperLid = landmarks[159].y; // বাম চোখের উপরের পাতা
  const lowerLid = landmarks[145].y; // বাম চোখের নিচের পাতা
  const eyeOpenness = lowerLid - upperLid;

  return { 
    x: gazeX, 
    y: gazeY, 
    rawX: avgX, 
    rawY: avgY,
    isOpen: eyeOpenness > 0.01 // চোখ খোলা আছে কি না তা বোঝার জন্য
  };
};