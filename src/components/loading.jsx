import React, { useEffect, useState } from 'react';
import logo from '../../public/logo.svg';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-500 overflow-hidden">
      <div className="flex flex-col items-center space-y-8 p-8">
        {/* Logo container with pulsing effect */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center relative z-10">
            <img
              src={logo}
              alt="Aurify Logo"
              className="w-16 h-16"
            />
          </div>
        </div>
        
        {/* Loading text */}
        <p className="text-white text-xl font-semibold">Loading your dashboard...</p>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Progress percentage */}
        <p className="text-white text-sm">{progress}%</p>
        
        {/* Loading dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((dot) => (
            <div 
              key={dot}
              className="w-3 h-3 bg-white rounded-full"
              style={{
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${dot * 0.16}s`
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Add a style tag for the custom animation */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}