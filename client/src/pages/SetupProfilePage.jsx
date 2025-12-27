import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

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

const Step2 = ({ formData, handleChange, previewUrl }) => (
  <div className="space-y-4 text-center">
    <h3 className="text-xl font-semibold text-gray-800">২. প্রোফাইল ছবি</h3>
    
    {/* ইমেজ প্রিভিউ সেকশন - এখানে onError যোগ করা হয়েছে */}
    <div className="flex justify-center mb-4">
      <img 
        src={previewUrl || "https://placehold.jp/150x150.png"} 
        alt="Avatar" 
        className="w-32 h-32 rounded-full object-cover border-2 border-blue-500"
        onError={(e) => { 
          e.target.onerror = null;
          e.target.src = "https://placehold.jp/150x150.png"; 
        }}
      />
    </div>

    <div>
      <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-2">ছবি নির্বাচন করুন</label>
      <input
        type="file"
        name="profilePicture"
        id="profilePicture"
        onChange={handleChange}
        accept="image/*"
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </div>
  </div>
);

const Step3 = () => (
  <div className="text-center p-8 bg-green-50 rounded-lg">
    <h3 className="text-2xl font-bold text-green-700">৩. সম্পন্ন করতে প্রস্তুত!</h3>
    <p className="mt-2 text-gray-600">আপনার সমস্ত তথ্য সংগ্রহ করা হয়েছে। এখন জমা দিন।</p>
  </div>
);

const SetupProfilePage = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ username: '', bio: '', profilePicture: null });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [Step1, Step2, Step3];
  const totalSteps = steps.length;
  const CurrentStepComponent = steps[currentStep - 1];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        setFormData(prev => ({ ...prev, [name]: file }));
        setPreviewUrl(URL.createObjectURL(file));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (step) => {
    setError(null);
    if (step === 1 && (!formData.username || formData.username.length < 3)) {
      setError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে।');
      return false;
    }
    return true;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => prev + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const dataToSend = new FormData();
      dataToSend.append('username', formData.username);
      dataToSend.append('bio', formData.bio);
      dataToSend.append('auth0Id', user.sub);
      if (formData.profilePicture) dataToSend.append('profilePicture', formData.profilePicture);

      const response = await axios.post("https://onyx-drift-app-final.onrender.com/api/profile/update", dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200 || response.status === 201) {
        alert('প্রোফাইল সেটআপ সফল!');
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'প্রোফাইল সাবমিট করার সময় ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-600">প্রোফাইল সেটআপ</h1>
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>ধাপ {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% সম্পূর্ণ</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
          </div>
        </div>
        {error && <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg text-sm">{error}</div>}
        <div className="min-h-[200px] border border-gray-200 p-6 rounded-lg">
            <CurrentStepComponent formData={formData} handleChange={handleChange} previewUrl={previewUrl} />
        </div>
        <div className="flex justify-between mt-8">
          {currentStep > 1 && <button onClick={handleBack} className="px-4 py-2 bg-gray-200 rounded-md">পূর্ববর্তী</button>}
          {currentStep < totalSteps ? (
            <button onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded-md ml-auto">পরবর্তী ধাপ</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md ml-auto">
              {loading ? 'জমা দেওয়া হচ্ছে...' : 'প্রোফাইল তৈরি করুন'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupProfilePage;