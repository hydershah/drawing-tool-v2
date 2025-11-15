/**
 * Logo Component
 * Fixed logo in top-left corner with theme-aware images
 */

interface LogoProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export function Logo({ onClick, isOpen = false }: LogoProps) {
  return (
    <div
      className={`fixed top-4 left-4 w-14 h-14 cursor-pointer relative z-[9999] transition-transform duration-300 ${
        isOpen ? 'rotate-90' : 'rotate-0'
      }`}
      onClick={onClick}
    >
      {/* Light theme logo */}
      <img
        src="/logos/logo-light.png?v=2"
        alt="Drawing Tool Logo"
        className="absolute inset-0 w-full h-full object-cover rounded-full dark-logo-fix-light"
      />
      {/* Dark theme logo */}
      <img
        src="/logos/logo-dark.png?v=2"
        alt="Drawing Tool Logo"
        className="absolute inset-0 w-full h-full object-cover rounded-full dark-logo-fix-dark"
      />
    </div>
  );
}
