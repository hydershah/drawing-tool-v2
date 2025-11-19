/**
 * Logo Component
 * Fixed logo in top-left corner with theme-aware images and animated frame cycling
 */

import { useState, useEffect } from 'react';

interface LogoProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export function Logo({ onClick, isOpen = false }: LogoProps) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Cycle through frames every 3 seconds when not paused
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentFrame((prev) => (prev === 4 ? 1 : prev + 1));
      }, 150);
      setTimeout(() => {
        setIsFlipping(false);
      }, 600);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className={`fixed top-4 left-4 w-14 h-14 cursor-pointer relative z-[9999] transition-transform duration-300 ${
        isOpen ? 'rotate-90' : 'rotate-0'
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="relative w-full h-full transition-transform duration-300 ease-in-out"
        style={{
          transform: isFlipping ? 'scaleX(0)' : 'scaleX(1)',
        }}
      >
        {/* Light theme logo frames */}
        {[1, 2, 3, 4].map((frame) => (
          <img
            key={`light-${frame}`}
            src={`/logos/${frame}-light.svg`}
            alt="Drawing Tool Logo"
            className={`absolute inset-0 w-full h-full object-contain dark-logo-fix-light ${
              currentFrame === frame ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {/* Dark theme logo frames */}
        {[1, 2, 3, 4].map((frame) => (
          <img
            key={`dark-${frame}`}
            src={`/logos/${frame}-dark.svg`}
            alt="Drawing Tool Logo"
            className={`absolute inset-0 w-full h-full object-contain dark-logo-fix-dark ${
              currentFrame === frame ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
