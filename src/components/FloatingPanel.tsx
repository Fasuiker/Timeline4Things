import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

interface FloatingPanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  accent?: 'blue' | 'red'
  wide?: boolean
  children: ReactNode
  footer: ReactNode
}

export function FloatingPanel({
  open,
  onClose,
  title,
  subtitle,
  accent = 'blue',
  wide = false,
  children,
  footer,
}: FloatingPanelProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const focusTitle = () => {
      const input = cardRef.current?.querySelector<HTMLInputElement>(
        'input:not([type="date"]):not([type="hidden"]), textarea',
      )
      input?.focus()
      input?.select()
    }

    const id = window.setTimeout(focusTitle, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="floating-panel-root" role="dialog" aria-modal="true">
      <button
        type="button"
        className="floating-panel-backdrop"
        onClick={onClose}
        aria-label="关闭"
      />
      <div
        ref={cardRef}
        className={cn(
          'floating-panel-card',
          wide && 'floating-panel-card--wide',
          accent === 'red' && 'floating-panel-card--red',
        )}
      >
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
    </div>,
    document.body,
  )
}
