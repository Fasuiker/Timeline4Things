import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FloatingPanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  accent?: 'blue' | 'red'
  children: ReactNode
  footer: ReactNode
}

export function FloatingPanel({
  open,
  onClose,
  title,
  subtitle,
  accent = 'blue',
  children,
  footer,
}: FloatingPanelProps) {
  if (!open) return null

  return (
    <div className="floating-panel-root" role="dialog" aria-modal="true">
      <button
        type="button"
        className="floating-panel-backdrop"
        onClick={onClose}
        aria-label="关闭"
      />
      <div className={cn('floating-panel-card', accent === 'red' && 'floating-panel-card--red')}>
        <div className="floating-panel-header">
          <div>
            <h2 className="floating-panel-title">{title}</h2>
            {subtitle && <p className="floating-panel-subtitle">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="floating-panel-close" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="floating-panel-body">{children}</div>
        <div className="floating-panel-footer">{footer}</div>
      </div>
    </div>
  )
}
