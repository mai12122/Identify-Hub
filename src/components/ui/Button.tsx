import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeMap: Record<string, string> = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-4.5 py-2.5 text-xs font-semibold gap-2',
    lg: 'px-6 py-3 text-sm gap-2.5'
  };

  const variantMap: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] border border-violet-400/20 font-medium',
    ghost: 'bg-white/3 text-zinc-300 border border-white/5 hover:bg-white/10 hover:text-white',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300'
  };

  const classes = `${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`;

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
