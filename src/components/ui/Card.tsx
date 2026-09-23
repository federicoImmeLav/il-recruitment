import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-il border border-border bg-white p-4 shadow-il sm:p-5 ${className}`}
      {...props}
    />
  )
}
