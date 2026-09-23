import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'blue' | 'success' | 'danger' | 'ghost'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-orange text-white hover:bg-orange-dark',
  blue: 'bg-blue text-white hover:bg-blue-dark',
  success: 'bg-green text-white hover:bg-green-dark',
  danger: 'bg-red text-white hover:bg-red-dark',
  ghost: 'bg-transparent text-text2 border border-border hover:bg-gray-light',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-il px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
