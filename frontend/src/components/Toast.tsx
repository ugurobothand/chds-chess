import { useState, useEffect, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

type Listener = (item: ToastItem) => void
const listeners: Listener[] = []
let nextId = 0

export const toast = {
  success: (message: string) => emit(message, 'success'),
  error:   (message: string) => emit(message, 'error'),
  info:    (message: string) => emit(message, 'info'),
}

function emit(message: string, type: ToastType) {
  const item: ToastItem = { id: nextId++, message, type }
  listeners.forEach(l => l(item))
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  const add = useCallback((item: ToastItem) => {
    setItems(prev => [...prev, item])
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== item.id)), 4000)
  }, [])

  useEffect(() => {
    listeners.push(add)
    return () => { const i = listeners.indexOf(add); if (i > -1) listeners.splice(i, 1) }
  }, [add])

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    info:    'bg-blue-600',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map(item => (
        <div
          key={item.id}
          className={`${colors[item.type]} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm text-sm
            animate-fade-in transition-all`}
        >
          {item.message}
        </div>
      ))}
    </div>
  )
}
