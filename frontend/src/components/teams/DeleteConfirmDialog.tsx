'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  itemName: string
  type?: 'team' | 'matchup'
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  type = 'team'
}: DeleteConfirmDialogProps) {
  const { theme } = useTheme()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error deleting:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getTypeColor = () => {
    return type === 'team' 
      ? 'from-red-500 to-red-600' 
      : 'from-orange-500 to-orange-600'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[500px] transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-red-600/30' 
          : 'bg-white border-red-300'
      }`}>
        {/* Header with icon */}
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          {/* Animated warning icon */}
          <div className={`relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getTypeColor()} animate-pulse`}>
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getTypeColor()} opacity-20 animate-ping`}></div>
            <AlertTriangle className="w-10 h-10 text-white relative z-10" />
          </div>

          <DialogHeader className="space-y-3">
            <DialogTitle className={`text-2xl font-bold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {title}
            </DialogTitle>
            <DialogDescription className={`text-base transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Item name display */}
        <div className={`mx-6 p-4 rounded-lg border-2 border-dashed transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-red-900/20 border-red-600/40'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            <Trash2 className={`w-5 h-5 transition-colors duration-300 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} />
            <span className={`font-semibold text-lg transition-colors duration-300 ${
              theme === 'dark' ? 'text-red-300' : 'text-red-700'
            }`}>
              {itemName}
            </span>
          </div>
        </div>

        {/* Warning message */}
        <div className={`mx-6 p-3 rounded-lg transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-yellow-900/20 border border-yellow-600/30'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className={`text-sm text-center transition-colors duration-300 ${
            theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'
          }`}>
            ⚠️ Cette action est irréversible
          </p>
        </div>

        {/* Action buttons */}
        <DialogFooter className="flex-row gap-3 sm:gap-2 px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className={`flex-1 transition-all duration-300 ${
              theme === 'dark'
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`flex-1 bg-gradient-to-r ${getTypeColor()} text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


