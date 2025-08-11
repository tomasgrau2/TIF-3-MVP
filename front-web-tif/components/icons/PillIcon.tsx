
import React from 'react';

interface IconProps {
  className?: string;
}

const PillIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    {/* A simple capsule/pill icon */}
    <path d="M19.5,7A4.5,4.5,0,0,0,15,2.5H9A4.5,4.5,0,0,0,4.5,7v10A4.5,4.5,0,0,0,9,21.5h6A4.5,4.5,0,0,0,19.5,17ZM9,4.5h6A2.5,2.5,0,0,1,17.5,7h-11A2.5,2.5,0,0,1,9,4.5Zm6,15H9A2.5,2.5,0,0,1,6.5,17h11A2.5,2.5,0,0,1,15,19.5Z" />
  </svg>
);

export default PillIcon;
