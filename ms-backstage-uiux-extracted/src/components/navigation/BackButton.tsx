import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label: string;
  targetRoute: string;
  params?: { orgId?: string; eventId?: string; attendeeId?: string };
  className?: string;
  onBeforeNavigate?: () => boolean; // return false to abort (e.g. unsaved changes warning)
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  label, 
  targetRoute, 
  params, 
  className = '',
  onBeforeNavigate
}) => {
  const { navigate } = useApp();

  const handleClick = () => {
    if (onBeforeNavigate && !onBeforeNavigate()) {
      return;
    }
    navigate(targetRoute, params);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl transition-all shadow-sm active:scale-95 ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  );
};
