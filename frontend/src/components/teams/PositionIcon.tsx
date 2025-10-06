'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'

interface PositionIconProps {
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const POSITION_IMAGE_PATHS = {
  TOP: '/images/positions/top.png',
  JUNGLE: '/images/positions/jungle.png',
  MID: '/images/positions/mid.png',
  ADC: '/images/positions/bot.png',
  SUPPORT: '/images/positions/supp.png'
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
}

export function PositionIcon({ position, size = 'md', className = '' }: PositionIconProps) {
  const { theme } = useTheme()
  
  return (
    <span 
      className={`inline-flex items-center justify-center ${SIZE_CLASSES[size]} ${className}`}
      title={position}
    >
      <Image
        src={POSITION_IMAGE_PATHS[position]}
        alt={`${position} position icon`}
        width={size === 'sm' ? 16 : size === 'lg' ? 32 : 24}
        height={size === 'sm' ? 16 : size === 'lg' ? 32 : 24}
        className="w-full h-full object-contain"
      />
    </span>
  )
}
