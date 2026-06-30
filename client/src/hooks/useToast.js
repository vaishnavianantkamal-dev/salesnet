import { useState, useCallback } from 'react'

let toastCounter = 0

const listeners = new Set()
let memoryToasts = []

function addToast(toast) {
  const id = ++toastCounter
  const newToast = { id, ...toast, open: true }
  memoryToasts = [...memoryToasts, newToast]
  listeners.forEach((listener) => listener(memoryToasts))

  if (toast.duration !== Infinity) {
    setTimeout(() => {
      dismissToast(id)
    }, toast.duration || 5000)
  }

  return id
}

function dismissToast(id) {
  memoryToasts = memoryToasts.map((t) =>
    t.id === id ? { ...t, open: false } : t
  )
  listeners.forEach((listener) => listener(memoryToasts))

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id)
    listeners.forEach((listener) => listener(memoryToasts))
  }, 300)
}

export function useToast() {
  const [toasts, setToasts] = useState(memoryToasts)

  const subscribe = useCallback((setFn) => {
    listeners.add(setFn)
    return () => listeners.delete(setFn)
  }, [])

  useState(() => {
    const unsubscribe = subscribe(setToasts)
    return unsubscribe
  })

  const toast = useCallback(({ title, description, variant = 'default', duration }) => {
    return addToast({ title, description, variant, duration })
  }, [])

  const dismiss = useCallback((id) => {
    dismissToast(id)
  }, [])

  return { toasts, toast, dismiss }
}

// Standalone toast function for use outside of components
export const toast = ({ title, description, variant = 'default', duration } = {}) => {
  return addToast({ title, description, variant, duration })
}

export { dismissToast as dismiss }
