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
    sm: 'w-10 h-8',
    md: 'w-12 h-10',
    lg: 'w-16 h-12',
    xl: 'w-20 h-16',
    '2xl': 'w-24 h-20'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo with simple rectangular styling */}
      <div className="flex-shrink-0">
        <Image
          src="/vignaharta.jpg"
          alt="विघ्नहर्ता जनसेवा Logo"
          width={size === 'sm' ? 40 : size === 'md' ? 48 : size === 'lg' ? 64 : size === 'xl' ? 80 : 96}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : size === 'xl' ? 64 : 80}
          className={`${sizeClasses[size]} object-cover rounded-lg ${animated ? 'animate-pulse' : 'hover:scale-105 transition-transform duration-300'}`}
          priority
        />
      </div>

      {/* Marathi Text without shadows */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${textSizeClasses[size]} logo-marathi`}>
            विघ्नहर्ता
          </span>
          <span className={`text-red-100 ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : size === 'lg' ? 'text-lg' : size === 'xl' ? 'text-xl' : 'text-2xl'} logo-marathi font-medium`}>
            जनसेवा
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
