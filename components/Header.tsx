import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const titleParts = title.split(' - ');
  const companyName = titleParts[0]; 
  const systemName = titleParts.slice(1).join(' - ');

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 sm:py-5 flex items-center justify-center sm:justify-start">
        {/* Adjusted SVG to be more abstract/data-related */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 text-sky-700" // var(--corporate-blue-primary)
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
           <path fillOpacity="0.5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" transform="translate(0, -0.5)" />
        </svg>
        <h1 className="text-xl sm:text-3xl font-bold text-slate-800 flex flex-col sm:flex-row sm:items-baseline">
          <span className="text-sky-700 font-extrabold tracking-tight">{companyName}</span>
          {systemName && <span className="text-sm sm:text-xl font-semibold text-slate-600 sm:ml-2"> - {systemName}</span>}
        </h1>
      </div>
    </header>
  );
};
