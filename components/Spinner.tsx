import React from 'react';

interface SpinnerProps {
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ text = "Carregando..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600"></div> {/* var(--corporate-blue-primary) for border */}
      <p className="mt-5 text-lg font-semibold text-slate-700">{text}</p>
    </div>
  );
};
