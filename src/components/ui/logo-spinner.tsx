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
      {/* Paper Stack Animation */}
      <div className="relative">
        <div className={cn('relative', sizeClasses[size])}>
          {/* Stack of papers */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Paper 1 - Bottom */}
            <div className="absolute w-full h-full bg-white border-2 border-gray-300 rounded-lg shadow-md transform rotate-3 animate-pulse"
                 style={{ animationDelay: '0s', animationDuration: '2s' }}>
              <div className="p-2 space-y-1">
                <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                <div className="h-1 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>

            {/* Paper 2 - Middle */}
            <div className="absolute w-full h-full bg-white border-2 border-gray-300 rounded-lg shadow-lg transform -rotate-2 animate-pulse"
                 style={{ animationDelay: '0.7s', animationDuration: '2s' }}>
              <div className="p-2 space-y-1">
                <div className="h-1 bg-red-200 rounded w-2/3"></div>
                <div className="h-1 bg-red-200 rounded w-3/4"></div>
                <div className="h-1 bg-red-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Paper 3 - Top */}
            <div className="absolute w-full h-full bg-white border-2 border-red-300 rounded-lg shadow-xl transform rotate-1 animate-pulse"
                 style={{ animationDelay: '1.4s', animationDuration: '2s' }}>
              <div className="p-2 space-y-1">
                <div className="h-1 bg-red-300 rounded w-3/4"></div>
                <div className="h-1 bg-red-300 rounded w-1/2"></div>
                <div className="h-1 bg-red-300 rounded w-2/3"></div>
              </div>
              {/* Government seal */}
              <div className="absolute bottom-1 right-1 w-3 h-3 bg-red-500 rounded-full opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Floating document icons */}
        <div className="absolute -inset-4">
          <div className="absolute top-0 left-1/2 text-red-400 animate-bounce" style={{ animationDelay: '0s' }}>📄</div>
          <div className="absolute top-1/2 right-0 text-orange-400 animate-bounce" style={{ animationDelay: '0.5s' }}>📋</div>
          <div className="absolute bottom-0 left-1/2 text-red-400 animate-bounce" style={{ animationDelay: '1s' }}>📑</div>
          <div className="absolute top-1/2 left-0 text-orange-400 animate-bounce" style={{ animationDelay: '1.5s' }}>📜</div>
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
