// src/App.tsx (সংশোধিত)
import React, { useEffect } from 'react';
// Ionic এবং Capacitor-এর সমস্ত ইম্পোর্ট সরানো হলো
// import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
// import { IonReactRouter } from '@ionic/react-router'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // React Router v7 এর জন্য

import { useAuth0 } from '@auth0/auth0-react';
// import { App as CapApp } from '@capacitor/app'; // সরানো হলো
// import { Browser } from '@capacitor/browser'; // সরানো হলো

/* আপনার অন্যান্য imports... যেমন:
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
*/

// setupIonicReact(); // সরানো হলো

const App: React.FC = () => {
  // Auth0 হুক থেকে কলব্যাক হ্যান্ডলার নিন
  const { handleRedirectCallback } = useAuth0();

  // useEffect Hook শুধুমাত্র নিশ্চিত করার জন্য যে Auth0 কলব্যাক সঠিকভাবে হ্যান্ডেল হচ্ছে
  // Auth0 SDK সাধারণত এটি নিজেই করে, কিন্তু কনভেনশন হিসেবে রাখা যেতে পারে।
  useEffect(() => {
    // ওয়েব ব্রাউজার কলব্যাক হ্যান্ডলিং (Capacitor/Mobile এর প্রয়োজন নেই)
    // যদি আপনি ওয়েব অ্যাপ চালান, Auth0 SDK নিজেই URL চেক করে থাকে।
    // এই লজিকটি Capacitor এর পরিবর্তে রাখা হয়েছিল, এখন এটি অপ্রয়োজনীয়।
    // তবুও, Auth0 SDK ব্যবহার করে URL চেক করার জন্য এটি রাখা যেতে পারে যদি প্রয়োজন হয়।
    if (window.location.search.includes('code') || window.location.search.includes('error')) {
      handleRedirectCallback(window.location.href);
    }
  }, [handleRedirectCallback]); // dependency array তে handleRedirectCallback যোগ করুন

  return (
    // IonApp এর পরিবর্তে সাধারণ div
    <div>
      {/* IonReactRouter এর পরিবর্তে BrowserRouter */}
      <BrowserRouter>
        {/* IonRouterOutlet এর পরিবর্তে Routes */}
        <Routes>
          {/* উদাহরণ রুট - আপনার আসল রুটগুলি এখানে যোগ করুন */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
          
          {/* যদি আপনার কোনো ডিফল্ট কম্পোনেন্ট থাকে */}
          {/* <Route path="/" element={<HomePage />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;