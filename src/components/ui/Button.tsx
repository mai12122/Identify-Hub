import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeMap: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-sm'
  };

  const variantMap: Record<string, string> = {
    primary: 'bg-gradient-to-b from-[#6c3ef2] to-[#8b5cf6] text-white border border-violet-500/20 shadow-md',
    ghost: 'bg-transparent text-zinc-300 border border-transparent hover:border-zinc-800/40',
    danger: 'bg-rose-600 text-white border border-rose-600/30'
  };

  const classes = `${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`;

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
