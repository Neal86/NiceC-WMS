import React from 'react';

interface NiceCLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export default function NiceCLogo({ 
  className = '', 
  size = 32, 
  showText = false, 
  textColor = 'text-white' 
}: NiceCLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="flex items-center justify-center shrink-0 bg-transparent"
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Top-left symmetric half of the logo */}
          <path 
            d="M 60 3 A 48 48 0 0 0 23.5 90 L 32 38 L 50 44 L 50 56 L 42 50 L 36.5 83 A 36 36 0 0 1 60 14 L 60 3 Z" 
            fill="#f59e0b"
          />
          {/* Bottom-right symmetric half of the logo (rotated 180 degrees around (50, 50)) */}
          <path 
            d="M 60 3 A 48 48 0 0 0 23.5 90 L 32 38 L 50 44 L 50 56 L 42 50 L 36.5 83 A 36 36 0 0 1 60 14 L 60 3 Z" 
            fill="#f59e0b"
            transform="rotate(180, 50, 50)"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col select-none leading-none">
          <span className={`font-sans font-black tracking-wider text-[14px] ${textColor}`}>
            NICEC
          </span>
          <span className="text-[9px] text-[#f59e0b] font-bold tracking-widest font-mono">
            WMS
          </span>
        </div>
      )}
    </div>
  );
}

