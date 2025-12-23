
import React, { useState, useMemo } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
  color?: string; // Tailwind bg color class, e.g. 'bg-red-500'
}

const Avatar: React.FC<AvatarProps> = ({ src, name, className = "w-10 h-10", color = "bg-gray-500" }) => {
  const [imageError, setImageError] = useState(false);

  // Performance Optimization: Memoize initials to prevent recalculation on every render
  const initials = useMemo(() => {
    return name
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, [name]);

  if (!src || imageError) {
    return (
      <div 
        className={`${className} ${color} rounded-full flex items-center justify-center text-white font-bold shadow-sm select-none`}
        title={name}
        style={{ fontSize: '0.4em' }}
      >
        <span className="text-[length:inherit]">{initials}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      className={`${className} rounded-full object-cover shadow-sm`}
      onError={() => setImageError(true)}
      title={name}
    />
  );
};

export default Avatar;
