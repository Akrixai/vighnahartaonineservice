'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo with modern styling */}
      <div className="flex-shrink-0 p-1 bg-white rounded-full shadow-lg border-2 border-red-600">
        <Image
          src="/vignaharta.png"
          alt="विघ्नहर्ता जनसेवा Logo"
          width={size === 'sm' ? 48 : size === 'md' ? 64 : size === 'lg' ? 80 : size === 'xl' ? 96 : 128}
          height={size === 'sm' ? 48 : size === 'md' ? 64 : size === 'lg' ? 80 : size === 'xl' ? 96 : 128}
          className={`${sizeClasses[size]} object-contain rounded-full ${animated ? 'animate-pulse' : 'hover:scale-105 transition-transform duration-300'}`}
          priority
        />
      </div>
      {/* Marathi Text without shadows */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-red-700 drop-shadow-sm ${textSizeClasses[size]} logo-marathi`}>विघ्नहर्ता</span>
          <span className={`text-red-500 ${size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-3xl'} logo-marathi font-medium`}>जनसेवा</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
