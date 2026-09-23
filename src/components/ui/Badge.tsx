import type { ReactNode } from 'react'

type Color = 'green' | 'orange' | 'blue' | 'gray' | 'red' | 'purple'

const COLOR_CLASSES: Record<Color, string> = {
  green: 'bg-green-light text-green-dark',
  orange: 'bg-orange-light text-orange-dark',
  blue: 'bg-blue-light text-blue-dark',
  gray: 'bg-gray-light text-text2',
  red: 'bg-red-light text-red-dark',
  purple: 'bg-purple-light text-purple-dark',
}

export function Badge({ color, children }: { color: Color; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${COLOR_CLASSES[color]}`}
    >
      {children}
    </span>
  )
}
