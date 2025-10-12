'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-700 border-2 border-slate-600'
          : 'bg-blue-500 border-2 border-blue-400'
      }`}
      aria-label="Toggle theme"
    >
      {/* Toggle circle */}
      <span
        className={`inline-block h-7 w-7 transform rounded-full bg-white transition-all duration-300 shadow-lg ${
          theme === 'dark' ? 'translate-x-11' : 'translate-x-1'
        }`}
      >
        {/* Icon inside the circle */}
        <span className="flex items-center justify-center h-full w-full">
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500" />
          )}
        </span>
      </span>
    </button>
  )
}
