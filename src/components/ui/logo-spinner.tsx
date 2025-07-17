'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

const LogoSpinner: React.FC<LogoSpinnerProps> = ({ 
  size = 'md', 
  className,
  text = 'Loading...',
  showText = true
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      {/* Animated Logo Container */}
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={cn(
          'absolute inset-0 rounded-full border-4 border-red-200 border-t-red-600 animate-spin',
          sizeClasses[size]
        )}></div>
        
        {/* Inner pulsing ring */}
        <div className={cn(
          'absolute inset-1 rounded-full border-2 border-orange-200 border-b-orange-500 animate-spin',
          sizeClasses[size]
        )} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        
        {/* Logo in center */}
        <div className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg animate-pulse',
          sizeClasses[size]
        )}>
          {/* Vignaharta Symbol */}
          <div className={cn(
            'font-bold text-white',
            size === 'sm' ? 'text-xs' :
            size === 'md' ? 'text-sm' :
            size === 'lg' ? 'text-base' : 'text-lg'
          )}>
            V
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute -inset-2">
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/2 right-0 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-0 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </div>

      {/* Loading Text */}
      {showText && (
        <div className="text-center">
          <p className={cn(
            'font-medium text-gray-700 animate-pulse',
            textSizeClasses[size]
          )}>
            {text}
          </p>
          <div className="flex justify-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoSpinner;

// Full screen loading overlay component
export const FullScreenLoader: React.FC<{ 
  text?: string;
  isVisible?: boolean;
}> = ({ 
  text = 'Loading...', 
  isVisible = true 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LogoSpinner size="xl" text={text} />
        <div className="mt-6 max-w-md">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page loading component
export const PageLoader: React.FC<{ 
  text?: string;
  className?: string;
}> = ({ 
  text = 'Loading page...', 
  className 
}) => {
  return (
    <div className={cn('flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg', className)}>
      <LogoSpinner size="lg" text={text} />
    </div>
  );
};

// Button loading component
export const ButtonLoader: React.FC<{ 
  size?: 'sm' | 'md';
  className?: string;
}> = ({ 
  size = 'sm', 
  className 
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <LogoSpinner size={size} showText={false} />
    </div>
  );
};
