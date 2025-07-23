'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface LoginAdvertisement {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

interface LoginAdvertisementsProps {
  className?: string;
}

function LoginAdvertisements({ className }: LoginAdvertisementsProps) {
  const [advertisements, setAdvertisements] = useState<LoginAdvertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch('/api/login-advertisements');
      if (response.ok) {
        const data = await response.json();
        setAdvertisements(data.advertisements || []);
      }
    } catch (error) {
      // Silently handle errors in production
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisements();

    // Set up real-time subscription
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
          fetchAdvertisements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (advertisements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % advertisements.length);
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [advertisements.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full p-8">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (advertisements.length === 0) {
    return (
      <div className={`${className}`}>
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full p-8">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">📢</div>
              <p>No advertisements available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentAd = advertisements[currentIndex];

  return (
    <div className={`${className}`}>
      <Card className="h-full overflow-hidden shadow-xl border-0 bg-gradient-to-br from-red-50 to-orange-50">
        <CardContent className="p-0 h-full relative">
          {/* Advertisement Content */}
          <div className="h-full flex flex-col">
            {/* Image Section */}
            <div className="relative h-80 overflow-hidden bg-gradient-to-br from-red-100 to-orange-100">
              {currentAd.image_url ? (
                <Image
                  src={currentAd.image_url}
                  alt={currentAd.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    // Hide the image on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  unoptimized={true}
                />
              ) : (
                // Fallback when no image URL
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-200 to-orange-200">
                  <div className="text-center text-red-700">
                    <div className="text-4xl mb-2">📢</div>
                    <div className="text-lg font-semibold">Advertisement</div>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              
              {/* Navigation Arrows */}
              {advertisements.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2">
                  {currentAd.title}
                </h3>
                {currentAd.description && (
                  <p className="text-gray-600 text-base mb-6 line-clamp-4">
                    {currentAd.description}
                  </p>
                )}
              </div>

              {/* Action Button */}
              {currentAd.link_url && (
                <div className="mt-auto">
                  {currentAd.link_url.startsWith('http') ? (
                    <a
                      href={currentAd.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                    >
                      Learn More
                      <ExternalLink className="w-5 h-5 ml-2" />
                    </a>
                  ) : (
                    <Link
                      href={currentAd.link_url}
                      className="inline-flex items-center justify-center w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                    >
                      Learn More
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dots Indicator */}
          {advertisements.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {advertisements.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentIndex ? 'bg-red-600' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Safe wrapper component that handles errors gracefully
export function SafeLoginAdvertisements({ className }: LoginAdvertisementsProps) {
  return (
    <React.Suspense fallback={
      <div className={`${className}`}>
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full p-8">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginAdvertisements className={className} />
    </React.Suspense>
  );
}

export default LoginAdvertisements;
