import { useEffect, useState } from 'react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

let globalToasts = []
const listeners = new Set()

function dispatch(toasts) {
  globalToasts = toasts
  listeners.forEach((l) => l(toasts))
}

let toastId = 0

export function toast({ title, description, variant = 'default', duration = 5000 }) {
  const id = ++toastId
  const newToast = { id, title, description, variant, open: true }
  dispatch([...globalToasts, newToast])

  if (duration !== Infinity) {
    setTimeout(() => {
      dispatch(globalToasts.map((t) => (t.id === id ? { ...t, open: false } : t)))
      setTimeout(() => {
        dispatch(globalToasts.filter((t) => t.id !== id))
      }, 300)
    }, duration)
  }

  return id
}

export function Toaster() {
  const [toasts, setToasts] = useState(globalToasts)

  useEffect(() => {
    listeners.add(setToasts)
    return () => listeners.delete(setToasts)
  }, [])

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} variant={variant} open={open}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
