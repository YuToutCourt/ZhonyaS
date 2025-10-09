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
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <span className="text-lg text-gray-500 dark:text-gray-400">Unranked</span>
      </div>
    )
  }

  // Parse rank string like "S1 90 LP" or "G2 51 LP"
  const parts = rank.split(' ')
  const rankCode = parts[0] // "S1", "G2", etc.
  const lp = parts[1] // "90", "51", etc.
  const lpText = parts[2] // "LP"

  // Extract tier letter and division number
  // For Master, Grandmaster, Challenger: "M", "GM", "C" (no division)
  let tierLetter = ''
  let division = ''
  
  if (rankCode === 'M' || rankCode === 'GM' || rankCode === 'C') {
    tierLetter = rankCode
  } else {
    tierLetter = rankCode[0] // "S", "G", etc.
    division = rankCode.slice(1) // "1", "2", etc.
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
        <span className={`text-sm text-gray-500 dark:text-gray-400`}>
          {lp} {lpText}
        </span>
      </div>
    </div>
  )
}
