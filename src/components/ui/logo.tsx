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
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo with rounded square styling and shadows */}
      <div className="flex-shrink-0 relative">
        {/* Background for better integration */}
        <div className={`absolute inset-0 bg-white/15 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg ${animated ? 'animate-pulse' : ''}`}></div>
        <div className="relative p-2">
          <Image
            src="/vignaharta.jpg"
            alt="विघ्नहर्ता जनसेवा Logo"
            width={size === 'sm' ? 48 : size === 'md' ? 64 : size === 'lg' ? 80 : size === 'xl' ? 96 : 128}
            height={size === 'sm' ? 48 : size === 'md' ? 64 : size === 'lg' ? 80 : size === 'xl' ? 96 : 128}
            className={`${sizeClasses[size]} object-cover rounded-lg shadow-2xl ring-2 ring-white/40 ${animated ? 'animate-bounce' : 'hover:scale-105 transition-transform duration-300'} filter drop-shadow-lg`}
            priority
          />
        </div>
      </div>

      {/* Marathi Text with enhanced shadows */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${textSizeClasses[size]} logo-marathi`}
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0px 0px 8px rgba(0,0,0,0.5)'
                }}>
            विघ्नहर्ता
          </span>
          <span className={`text-red-100 ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : size === 'lg' ? 'text-lg' : size === 'xl' ? 'text-xl' : 'text-2xl'} logo-marathi font-medium`}
                style={{
                  textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0px 0px 6px rgba(0,0,0,0.4)'
                }}>
            जनसेवा
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
