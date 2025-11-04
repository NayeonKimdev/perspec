import React from 'react';

const Skeleton = ({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height,
  circle = false 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
    title: 'rounded h-6',
    subtitle: 'rounded h-5',
    avatar: 'rounded-full',
    card: 'rounded-lg'
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  const classes = circle 
    ? `${baseClasses} rounded-full ${variantClasses.circular} ${className}`
    : `${baseClasses} ${variantClasses[variant]} ${className}`;

  return <div className={classes} style={style} />;
};

// 일반적인 스켈레톤 패턴들
export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4 transition-colors duration-200">
    <Skeleton variant="title" width="60%" />
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="80%" />
    <div className="flex space-x-2">
      <Skeleton variant="rectangular" width="100px" height="32px" />
      <Skeleton variant="rectangular" width="100px" height="32px" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4 transition-colors duration-200">
        <Skeleton variant="avatar" width="48px" height="48px" circle />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" width="40%" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton variant="title" width="200px" />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" width="100%" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <Skeleton variant="subtitle" width="60%" className="mb-2" />
          <Skeleton variant="title" width="40%" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export const SkeletonGallery = ({ count = 12 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-200">
        <Skeleton variant="rectangular" width="100%" height="200px" className="rounded-t-lg" />
        <div className="p-3 space-y-2">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;

