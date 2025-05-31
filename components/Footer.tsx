import React from 'react';
import { COMPANY_NAME } from '../constants'; // This will now be BankSync

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100/80 backdrop-blur-md text-slate-500 py-6 mt-auto border-t border-slate-200">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} <span className="text-sky-700 font-bold tracking-tight">HealthAdmin</span>. Todos os direitos reservados (Simulado).</p>
        <p className="text-xs mt-1">Uma solução <span className="text-sky-600 font-semibold">{COMPANY_NAME}</span> para otimizar sua gestão financeira.</p>
      </div>
    </footer>
  );
};