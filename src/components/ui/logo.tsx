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

  // Ganapati-inspired elephant logo that always works (no external files needed)
  const GanapatiLogo = () => (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-800 shadow-lg border-2 border-yellow-300/30 ${animated ? 'animate-pulse' : ''}`}
    >
      {/* Elephant face design */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Main head circle */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-500 to-red-700 border border-yellow-300/20"></div>

        {/* Ears */}
        <div className="absolute left-0 top-1/4 w-3 h-4 bg-red-600 rounded-full transform -rotate-12 opacity-80"></div>
        <div className="absolute right-0 top-1/4 w-3 h-4 bg-red-600 rounded-full transform rotate-12 opacity-80"></div>

        {/* Eyes */}
        <div className="absolute left-1/3 top-1/3 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute right-1/3 top-1/3 w-1 h-1 bg-white rounded-full"></div>

        {/* Trunk (curved) */}
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-3 bg-red-500 rounded-full transform rotate-12"></div>
        </div>

        {/* Tilaka (forehead mark) */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-yellow-300 rounded-full opacity-90"></div>

        {/* Om symbol representation */}
        {size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-yellow-300 font-bold text-xs opacity-70">
              ॐ
            </div>
          </div>
        )}
      </div>

      {/* Decorative border elements */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full opacity-80"></div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full opacity-80"></div>
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-yellow-300 rounded-full opacity-80"></div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-yellow-300 rounded-full opacity-80"></div>

      {/* Inner glow */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-300/20 to-transparent pointer-events-none"></div>

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
          <GanapatiLogo />
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
