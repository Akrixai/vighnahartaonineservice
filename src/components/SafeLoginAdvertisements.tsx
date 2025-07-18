'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SafeLoginAdvertisementsProps {
  className?: string;
}

// Safe fallback advertisements that don't require external images
const fallbackAds = [
  {
    id: 'fallback-1',
    title: 'विघ्नहर्ता जनसेवा',
    description: 'Your trusted partner for all government services. Fast, reliable, and secure.',
    image_url: null,
    link_url: '#',
    is_active: true,
    background: 'from-red-500 to-red-700',
    icon: '🏛️'
  },
  {
    id: 'fallback-2', 
    title: 'Digital India Initiative',
    description: 'Empowering citizens with digital government services. Join the digital revolution.',
    image_url: null,
    link_url: '#',
    is_active: true,
    background: 'from-blue-500 to-blue-700',
    icon: '🇮🇳'
  },
  {
    id: 'fallback-3',
    title: 'Secure & Fast Services',
    description: 'Get your documents processed quickly with our secure online platform.',
    image_url: null,
    link_url: '#',
    is_active: true,
    background: 'from-green-500 to-green-700',
    icon: '🔒'
  }
];

export default function SafeLoginAdvertisements({ className = '' }: SafeLoginAdvertisementsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [advertisements, setAdvertisements] = useState(fallbackAds);
  const [isLoading, setIsLoading] = useState(true);

  // Try to load real advertisements, but fall back to safe ones
  useEffect(() => {
    const loadAdvertisements = async () => {
      try {
        const response = await fetch('/api/login-advertisements');
        if (response.ok) {
          const data = await response.json();
          if (data.advertisements && data.advertisements.length > 0) {
            // Use all active advertisements (no filtering needed for image URLs)
            const activeAds = data.advertisements.filter((ad: any) => ad.is_active);

            if (activeAds.length > 0) {
              setAdvertisements(activeAds);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load advertisements, using fallback:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdvertisements();

    // Set up real-time subscription for login advertisements
    const channel = supabase
      .channel('login-advertisements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'login_advertisements'
        },
        () => {
          console.log('Login advertisements changed, reloading...');
          loadAdvertisements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-advance advertisements
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [advertisements.length]);

  const nextAd = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevAd = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  const currentAd = advertisements[currentIndex];

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <Card className="h-full overflow-hidden shadow-xl border-0 bg-gradient-to-br from-gray-100 to-gray-200">
          <CardContent className="p-0 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading advertisements...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <Card className="h-full overflow-hidden shadow-xl border-0 bg-gradient-to-br from-red-50 to-orange-50">
        <CardContent className="p-0 h-full relative">
          <div className="h-full flex flex-col">
            {/* Image/Background Section */}
            <div className={`relative h-80 overflow-hidden bg-gradient-to-br ${currentAd.background || 'from-red-500 to-red-700'}`}>
              {/* Database advertisement with image */}
              {currentAd.image_url ? (
                <>
                  <Image
                    src={currentAd.image_url}
                    alt={currentAd.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      console.warn('Advertisement image failed to load:', currentAd.image_url);
                      // Hide the image on error and show fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">{currentAd.title}</h3>
                  </div>
                </>
              ) : (
                <>
                  {/* Safe background pattern for fallback ads */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                      backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                                       radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
                      backgroundSize: '50px 50px'
                    }}></div>
                  </div>

                  {/* Icon and content for fallback ads */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">{currentAd.icon}</div>
                      <h3 className="text-2xl font-bold mb-2">{currentAd.title}</h3>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </>
              )}
              
              {/* Navigation Arrows */}
              {advertisements.length > 1 && (
                <>
                  <button
                    onClick={prevAd}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextAd}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 bg-white">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{currentAd.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {currentAd.description}
              </p>

              {/* Link button for database advertisements */}
              {currentAd.link_url && (
                <div className="mb-4">
                  <a
                    href={currentAd.link_url}
                    target={currentAd.link_url.startsWith('http') ? '_blank' : '_self'}
                    rel={currentAd.link_url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Learn More
                    {currentAd.link_url.startsWith('http') && (
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </a>
                </div>
              )}

              {/* Indicators */}
              {advertisements.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {advertisements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentIndex ? 'bg-red-600 w-6' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
