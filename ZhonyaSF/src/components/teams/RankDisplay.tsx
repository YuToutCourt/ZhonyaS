'use client'

import Image from 'next/image'

interface RankDisplayProps {
  rank: string
  className?: string
}

// Mapping rank abbreviations to full names
const RANK_TIER_MAP: { [key: string]: string } = {
  'I': 'Iron',
  'B': 'Bronze',
  'S': 'Silver',
  'G': 'Gold',
  'P': 'Platinum',
  'E': 'Emerald',
  'D': 'Diamond',
  'M': 'Master',
  'GM': 'Grandmaster',
  'C': 'Challenger'
}

// Mapping rank tier to image file
const RANK_TIER_IMAGES: { [key: string]: string } = {
  'I': '/images/iron.webp',
  'B': '/images/bronze.webp',
  'S': '/images/silver.webp',
  'G': '/images/gold.webp',
  'P': '/images/platinum.webp',
  'E': '/images/emerald.webp',
  'D': '/images/diamond.webp',
  'M': '/images/master.webp',
  'GM': '/images/grandmaster.webp',
  'C': '/images/challenger.webp'
}

const RANK_COLORS = {
  'I': 'text-gray-600 dark:text-gray-400',
  'B': 'text-amber-600 dark:text-amber-400',
  'S': 'text-gray-500 dark:text-gray-300',
  'G': 'text-yellow-500 dark:text-yellow-400',
  'P': 'text-green-500 dark:text-green-400',
  'E': 'text-emerald-500 dark:text-emerald-400',
  'D': 'text-blue-500 dark:text-blue-400',
  'M': 'text-purple-500 dark:text-purple-400',
  'GM': 'text-pink-500 dark:text-pink-400',
  'C': 'text-red-500 dark:text-red-400'
}

export function RankDisplay({ rank, className = '' }: RankDisplayProps) {
  if (!rank || rank === 'N/A') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <Image
          src="/images/unranked.webp"
          alt="Unranked"
          width={64}
          height={64}
          className="w-16 h-16 object-contain"
        />
        <span className="text-lg text-gray-500 dark:text-gray-400">Unranked</span>
      </div>
    )
  }

  // Parse rank string like 
  // Format 1: "G2 67 LP" (3 parts)
  // Format 2: "EMERALD IV (0 LP) - 87W/88L (Winrate: 49.71%)" (8 parts)
  const parts = rank.split(' ')
  
  let tierLetter = ''
  let division = ''
  let lp = ''
  let lpText = ''
  
  if (parts.length === 3) {
    // Format court: "G2 67 LP"
    const rankCode = parts[0] // "G2", "P4", "S1", "M", "GM", "C", etc.
    lp = parts[1] // "67", "90", etc.
    lpText = parts[2] // "LP"
    
    if (rankCode === 'M' || rankCode === 'GM' || rankCode === 'C') {
      tierLetter = rankCode
    } else {
      tierLetter = rankCode[0] // "G", "P", "S", etc.
      division = rankCode.slice(1) // "2", "4", "1", etc.
    }
  } else {
    // Format long: "EMERALD IV (0 LP) - 87W/88L (Winrate: 49.71%)"
    const tierName = parts[0] // "EMERALD", "GOLD", "SILVER", etc.
    division = parts[1] // "IV", "III", "II", "I"
    const lpPart = parts[2] // "(0"
    
    // Extraire les LP du format "(0"
    lp = lpPart.replace('(', '') // "0"
    lpText = 'LP'
    
    // Convertir le nom du tier en lettre
    const tierNameToLetter: { [key: string]: string } = {
      'IRON': 'I',
      'BRONZE': 'B',
      'SILVER': 'S',
      'GOLD': 'G',
      'PLATINUM': 'P',
      'EMERALD': 'E',
      'DIAMOND': 'D',
      'MASTER': 'M',
      'GRANDMASTER': 'GM',
      'CHALLENGER': 'C'
    }
    tierLetter = tierNameToLetter[tierName] || 'I'
  }

  // Get rank image and name
  const rankImage = RANK_TIER_IMAGES[tierLetter]
  const rankName = RANK_TIER_MAP[tierLetter]
  
  // Get rank color
  const rankColor = RANK_COLORS[tierLetter as keyof typeof RANK_COLORS] || 'text-gray-500'

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {rankImage ? (
        <Image
          src={rankImage}
          alt={rankName}
          width={64}
          height={64}
          className="w-16 h-16 object-contain"
        />
      ) : (
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
      )}
      <div className="flex flex-col">
        <span className={`text-lg font-bold ${rankColor}`}>
          {rankName} {division}
        </span>
        {lp && lpText && (
          <span className={`text-sm text-gray-500 dark:text-gray-400`}>
            {lp} {lpText}
          </span>
        )}
      </div>
    </div>
  )
}
