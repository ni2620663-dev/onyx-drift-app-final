// client/src/pages/SetupProfilePage.jsx

import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// --- স্টেপ কম্পোনেন্ট ---

const Step1 = ({ formData, handleChange }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-gray-800">১. বেসিক প্রোফাইল তথ্য</h3>
    <div>
      <label htmlFor="username" className="block text-sm font-medium text-gray-700">ইউজারনেম (Username)</label>
      <input
        type="text"
        name="username"
        id="username"
        value={formData.username || ''}
        onChange={handleChange}
        required
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        placeholder="আপনার প্রোফাইল নাম"
      />
    </div>
    <div>
      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">বায়ো (Bio)</label>
      <textarea
        name="bio"
        id="bio"
        rows="3"
        value={formData.bio || ''}
        onChange={handleChange}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        placeholder="আপনার সম্পর্কে কিছু বলুন"
      />
    </div>
  </div>
);

const Step2 = ({ formData, handleChange }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-gray-800">২. প্রোফাইল ছবি</h3>
    {/* এখানে ছবি আপলোডের লজিক থাকবে, আপাতত এটি একটি ডামি ইনপুট */}
    <p className="text-sm text-gray-500">পরবর্তী ধাপে আমরা ফাইল আপলোডের জটিলতা নিয়ে কাজ করব।</p>
    <div>
      <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">ছবি আপলোড</label>
      <input
        type="file"
        name="profilePicture"
        id="profilePicture"
        onChange={handleChange}
        accept="image/*"
        className="mt-1 block w-full text-sm text-gray-500"
      />
    </div>
    {/* ছবি প্রিভিউ করার লজিক এখানে যোগ করা যেতে পারে */}
  </div>
);

const Step3 = () => (
  <div className="text-center p-8 bg-green-50 rounded-lg">
    <h3 className="text-2xl font-bold text-green-700">৩. সম্পন্ন করতে প্রস্তুত!</h3>
    <p className="mt-2 text-gray-600">আপনার সমস্ত তথ্য সংগ্রহ করা হয়েছে। এখন জমা দিন।</p>
  </div>
);

// --- মূল সেটআপ পেজ কম্পোনেন্ট ---

const SetupProfilePage = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ 
    username: '', 
    bio: '', 
    profilePicture: null 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // সব স্টেপগুলি একটি অ্যারেতে রাখা
  const steps = [Step1, Step2, Step3];
  const totalSteps = steps.length;
  const CurrentStepComponent = steps[currentStep - 1];

  // ইনপুট পরিবর্তন হ্যান্ডেল
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  // ভ্যালিডেশন লজিক
  const validateStep = (step) => {
    setError(null);
    if (step === 1 && (!formData.username || formData.username.length < 3)) {
      setError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে।');
      return false;
    }
    // ভবিষ্যতে অন্যান্য ধাপের ভ্যালিডেশন এখানে যোগ করুন
    return true;
  };

  // পরবর্তী ধাপে যাওয়া
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  // পূর্ববর্তী ধাপে যাওয়া
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // চূড়ান্ত সাবমিট
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return; // চূড়ান্ত ভ্যালিডেশন
    
    setLoading(true);

    try {
      const accessToken = await getAccessTokenSilently();
      
      // এখানে আপনার Express ব্যাকএন্ড API এন্ডপয়েন্টে ডেটা পাঠানো হবে।
      console.log('Final Data:', { ...formData, auth0Id: user.sub });
      
      // সফল হলে ইউজারকে ড্যাশবোর্ডে রিডাইরেক্ট করা
      alert('প্রোফাইল সেটআপ সফল! আপনাকে ড্যাশবোর্ডে পাঠানো হচ্ছে।');
      // window.location.href = '/dashboard'; // আপনার ড্যাশবোর্ড রুটে যান

    } catch (err) {
      console.error('Submission Error:', err);
      setError('প্রোফাইল সাবমিট করার সময় একটি ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl">
        
        <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-600">
          প্রোফাইল সেটআপ
        </h1>

        {/* ধাপ নির্দেশক (Progress Bar) */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>ধাপ {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% সম্পূর্ণ</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* ত্রুটির বার্তা */}
        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        {/* বর্তমান ধাপের কম্পোনেন্ট রেন্ডার */}
        <div className="min-h-[200px] border border-gray-200 p-6 rounded-lg">
            <CurrentStepComponent formData={formData} handleChange={handleChange} />
        </div>

        {/* নেভিগেশন বাটন */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              পূর্ববর্তী
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition duration-150 ${
                loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              } ${currentStep === 1 ? 'ml-auto' : ''}`} // প্রথম ধাপে ডানে সরানোর জন্য
              disabled={loading}
            >
              পরবর্তী ধাপ
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition duration-150 ${
                loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
              } ml-auto`}
              disabled={loading}
            >
              {loading ? 'জমা দেওয়া হচ্ছে...' : 'প্রোফাইল তৈরি করুন'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupProfilePage;