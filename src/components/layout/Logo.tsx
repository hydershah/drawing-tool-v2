/**
 * Logo Component
 * Fixed logo in top-left corner with theme-aware images and animated frame cycling
 */

import { useState, useEffect } from 'react';

interface LogoProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export function Logo({ onClick }: LogoProps) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Cycle through frames every 4 seconds when not paused
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentFrame((prev) => (prev === 4 ? 1 : prev + 1));
      }, 200);
      setTimeout(() => {
        setIsFlipping(false);
      }, 800);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="fixed top-4 left-4 w-[90px] h-[90px] cursor-pointer relative z-[9999]"
      onClick={onClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Static circle background - black in light mode, white in dark mode */}
      <div className="absolute inset-0 w-full h-full bg-black dark:bg-white rounded-full" />

      <div
        className="relative w-full h-full"
        style={{
          transform: isFlipping ? 'scale(1.10) scaleX(0)' : 'scale(1.10) scaleX(1)',
          transition: 'transform 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        {/* Light theme logo frames (use light SVGs for light mode) */}
        {[1, 2, 3, 4].map((frame) => (
          <img
            key={`light-${frame}`}
            src={`/logos/${frame}-light.svg`}
            alt="Drawing Tool Logo"
            className={`absolute inset-0 w-full h-full object-contain dark-logo-fix-light transition-opacity duration-300 ${
              currentFrame === frame ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {/* Dark theme logo frames (use dark SVGs for dark mode) */}
        {[1, 2, 3, 4].map((frame) => (
          <img
            key={`dark-${frame}`}
            src={`/logos/${frame}-dark.svg`}
            alt="Drawing Tool Logo"
            className={`absolute inset-0 w-full h-full object-contain dark-logo-fix-dark transition-opacity duration-300 ${
              currentFrame === frame ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
