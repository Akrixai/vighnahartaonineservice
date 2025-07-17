'use client';

import React, { useState, useEffect } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = true,
  animated = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Preload image and test if it exists
  useEffect(() => {
    // For now, skip image loading and use CSS logo directly
    // This ensures the logo always works
    const useDirectCssLogo = true;

    if (useDirectCssLogo) {
      setImageError(true);
      console.log('🎨 Using CSS-only logo for reliability');
      return;
    }

    const imagesToTry = ['/vignaharta.jpg', '/vignaharta.png', '/vignaharta.svg'];
    let currentIndex = 0;

    const tryNextImage = () => {
      if (currentIndex >= imagesToTry.length) {
        setImageError(true);
        console.error('❌ All logo images failed to load, using CSS fallback');
        return;
      }

      const testImage = new Image();
      const currentSrc = imagesToTry[currentIndex];

      testImage.onload = () => {
        setImageLoaded(true);
        console.log(`✅ Logo image loaded successfully: ${currentSrc}`);
      };

      testImage.onerror = (e) => {
        console.warn(`❌ Failed to load ${currentSrc}:`, e);
        currentIndex++;
        tryNextImage();
      };

      // Add a small delay and cache busting
      setTimeout(() => {
        testImage.src = `${currentSrc}?v=${Date.now()}`;
      }, 100);
    };

    tryNextImage();
  }, []);

  // Simple Vignaharta logo fallback (no external files needed)
  const VignahartaLogo = () => (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-800 shadow-lg border-2 border-yellow-300/30 ${animated ? 'animate-pulse' : ''}`}
    >
      {/* Simple "V" for Vignaharta */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className={`font-bold text-white ${
          size === 'sm' ? 'text-xs' :
          size === 'md' ? 'text-sm' :
          size === 'lg' ? 'text-base' : 'text-lg'
        }`}>
          V
        </div>
      </div>

      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border border-yellow-300/40"></div>
    </div>
  );

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo with external SVG file and inline fallback */}
      <div className="flex-shrink-0">
        {!imageError ? (
          <picture>
            <source srcSet="/vignaharta.jpg" type="image/jpeg" />
            <source srcSet="/vignaharta.png" type="image/png" />
            <img
              src="/vignaharta.svg"
              alt="विघ्नहर्ता जनसेवा Logo"
              className={`${sizeClasses[size]} object-contain drop-shadow-lg ${animated ? 'animate-pulse' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300`}
              onError={(e) => {
                console.error('❌ Logo image failed to load in component:', e);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Logo image loaded in component');
                setImageLoaded(true);
              }}
              loading="eager"
              decoding="async"
            />
          </picture>
        ) : (
          <VignahartaLogo />
        )}
      </div>

      {/* Marathi Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${textSizeClasses[size]}`}>
            विघ्नहर्ता
          </span>
          <span className={`text-red-200 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            जनसेवा
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
