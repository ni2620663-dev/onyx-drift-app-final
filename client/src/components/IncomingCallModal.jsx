import React from 'react';

const IncomingCallModal = ({ callerName, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center animate-bounce-slow">
        <div className="mb-4">
          <img 
            src="https://via.placeholder.com/100" 
            alt="caller" 
            className="w-20 h-20 rounded-full mx-auto border-4 border-green-500"
          />
        </div>
        <h3 className="text-xl font-bold mb-2">{callerName} কল দিচ্ছে...</h3>
        <div className="flex justify-center gap-6 mt-6">
          <button 
            onClick={onAccept}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold transition"
          >
            রিসিভ করুন
          </button>
          <button 
            onClick={onReject}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold transition"
          >
            কেটে দিন
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;