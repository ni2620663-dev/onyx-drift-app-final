class GazeFocusEngine {
  constructor() {
    this.elements = new Map(); // UI এলিমেন্টগুলোর তালিকা
  }

  // UI এলিমেন্ট রেজিস্টার করা (যেমন: বাটন, মেসেজ, পোস্ট)
  registerElement(id, element) {
    this.elements.set(id, element);
  }

  // চোখের পজিশনের সাথে এলিমেন্ট ম্যাচ করা
  detectFocus(gazeX, gazeY) {
    for (let [id, el] of this.elements) {
      const rect = el.getBoundingClientRect();
      
      // এলিমেন্টের সীমানার ভেতরে কি ইউজার তাকাচ্ছে?
      if (
        gazeX >= rect.left && 
        gazeX <= rect.right && 
        gazeY >= rect.top && 
        gazeY <= rect.bottom
      ) {
        return id; // ফোকাসড এলিমেন্টের ID রিটার্ন করবে
      }
    }
    return null;
  }
}

export default new GazeFocusEngine();