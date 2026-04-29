import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem] py-16 px-8 flex flex-col items-center justify-center text-center",
        className
      )}
    >
      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm mb-4 border border-slate-100">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">{title}</h4>
      {description && <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">{description}</p>}
      
      {action && (
        <button 
          onClick={action.onClick}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
