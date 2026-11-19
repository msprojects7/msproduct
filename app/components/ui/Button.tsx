import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-subtle border border-blue-700 focus-visible:ring-blue-500',
      secondary:
        'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-subtle focus-visible:ring-slate-400',
      tertiary:
        'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 border border-transparent focus-visible:ring-slate-400',
      ghost:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400',
      destructive:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-subtle border border-red-700 focus-visible:ring-red-500',
      icon:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-700 p-2 rounded-lg focus-visible:ring-blue-500',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      sm: variant === 'icon' ? 'p-1.5' : 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
      md: variant === 'icon' ? 'p-2' : 'text-sm px-3.5 py-2 rounded-lg gap-2',
      lg: variant === 'icon' ? 'p-3' : 'text-base px-5 py-2.5 rounded-lg gap-2.5',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
