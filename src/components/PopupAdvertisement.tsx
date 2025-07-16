'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRealTimeAdvertisements } from '@/hooks/useRealTimeData';

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  click_count: number;
}

export default function PopupAdvertisement() {
  const [showPopup, setShowPopup] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [hasShownToday, setHasShownToday] = useState(false);

  // Get popup advertisements
  const { data: advertisements, loading } = useRealTimeAdvertisements('popup', true);

  // Filter active advertisements that are within date range
  const activeAds = advertisements?.filter(ad => {
    if (!ad.is_active) return false;
    
    const now = new Date();
    const startDate = new Date(ad.start_date);
    const endDate = ad.end_date ? new Date(ad.end_date) : null;
    
    if (startDate > now) return false;
    if (endDate && endDate < now) return false;
    
    return true;
  }) || [];

  useEffect(() => {
    if (loading || activeAds.length === 0) return;

    // Check if popup was already shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('popup-ad-last-shown');
    
    if (lastShown === today) {
      setHasShownToday(true);
      return;
    }

    // Show popup after 5 seconds delay
    const timer = setTimeout(() => {
      setShowPopup(true);
      localStorage.setItem('popup-ad-last-shown', today);
      setHasShownToday(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading, activeAds.length]);

  const handleAdClick = async (ad: Advertisement) => {
    // Track click
    try {
      await fetch('/api/advertisements/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: ad.id }),
      });
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }

    // Open link if provided
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  if (!showPopup || activeAds.length === 0) {
    return null;
  }

  const currentAd = activeAds[currentAdIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold">Special Announcement</h3>
          <button
            onClick={closePopup}
            className="text-white hover:text-red-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Advertisement Content */}
        <div 
          className="cursor-pointer"
          onClick={() => handleAdClick(currentAd)}
        >
          <img
            src={currentAd.image_url}
            alt={currentAd.title}
            className="w-full h-64 object-cover"
          />
          
          <div className="p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{currentAd.title}</h4>
            {currentAd.description && (
              <p className="text-gray-600 mb-4">{currentAd.description}</p>
            )}
            
            {currentAd.link_url && (
              <div className="text-center">
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Learn More
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Multiple ads navigation */}
        {activeAds.length > 1 && (
          <div className="bg-gray-50 p-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentAdIndex(prev => prev === 0 ? activeAds.length - 1 : prev - 1)}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Previous
            </button>
            <span className="text-gray-600 text-sm">
              {currentAdIndex + 1} of {activeAds.length}
            </span>
            <button
              onClick={() => setCurrentAdIndex(prev => prev === activeAds.length - 1 ? 0 : prev + 1)}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Next
            </button>
          </div>
        )}

        {/* Close button */}
        <div className="bg-gray-50 p-4 text-center border-t">
          <button
            onClick={closePopup}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
