// src/components/Logo.tsx

import React from 'react';

interface LogoProps {
  variant?: 'primary' | 'white' | 'horizontal';
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'primary', size = 50, className = '' }) => {
  if (variant === 'horizontal') {
    return (
      <svg 
        className={className}
        width={size * 4} 
        height={size} 
        viewBox="0 0 200 60" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#818CF8', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r="25" fill="url(#logoGradient)" />
        <path 
          d="M 20 30 Q 20 18, 30 18 Q 40 18, 40 24" 
          stroke="white" 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
        />
        <path 
          d="M 20 30 Q 20 42, 30 42 Q 40 42, 40 36" 
          stroke="white" 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
        />
        <line x1="15" y1="25" x2="35" y2="25" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="15" y1="35" x2="35" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <text x="65" y="38" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#4F46E5">
          HelpTax
        </text>
      </svg>
    );
  }

  if (variant === 'white') {
    return (
      <svg 
        className={className}
        width={size} 
        height={size} 
        viewBox="0 0 200 200" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="90" fill="white" />
        <path 
          d="M 70 100 Q 70 60, 100 60 Q 130 60, 130 80" 
          stroke="#6366F1" 
          strokeWidth="12" 
          fill="none" 
          strokeLinecap="round"
        />
        <path 
          d="M 70 100 Q 70 140, 100 140 Q 130 140, 130 120" 
          stroke="#6366F1" 
          strokeWidth="12" 
          fill="none" 
          strokeLinecap="round"
        />
        <line x1="55" y1="85" x2="115" y2="85" stroke="#6366F1" strokeWidth="8" strokeLinecap="round" />
        <line x1="55" y1="115" x2="115" y2="115" stroke="#6366F1" strokeWidth="8" strokeLinecap="round" />
        <rect x="100" y="95" width="15" height="35" fill="#6366F1" rx="2" />
        <rect x="120" y="85" width="15" height="45" fill="#6366F1" rx="2" />
        <rect x="140" y="75" width="15" height="55" fill="#6366F1" rx="2" />
      </svg>
    );
  }

  // Primary variant (default)
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradientPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#818CF8', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#logoGradientPrimary)" />
      <path 
        d="M 70 100 Q 70 60, 100 60 Q 130 60, 130 80" 
        stroke="white" 
        strokeWidth="12" 
        fill="none" 
        strokeLinecap="round"
      />
      <path 
        d="M 70 100 Q 70 140, 100 140 Q 130 140, 130 120" 
        stroke="white" 
        strokeWidth="12" 
        fill="none" 
        strokeLinecap="round"
      />
      <line x1="55" y1="85" x2="115" y2="85" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <line x1="55" y1="115" x2="115" y2="115" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <rect x="100" y="95" width="15" height="35" fill="white" opacity="0.9" rx="2" />
      <rect x="120" y="85" width="15" height="45" fill="white" opacity="0.9" rx="2" />
      <rect x="140" y="75" width="15" height="55" fill="white" opacity="0.9" rx="2" />
    </svg>
  );
};

export default Logo;