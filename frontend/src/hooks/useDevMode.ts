import { useState, useEffect } from 'react'

const KEY = 'devModeAccountIndex'

export function useDevMode() {
  const [accountIndex, setAccountIndex] = useState<number | null>(() => {
    const raw = localStorage.getItem(KEY)
    return raw ? Number(raw) : null
  })

  useEffect(() => {
    if (accountIndex !== null) {
      localStorage.setItem(KEY, String(accountIndex))
    } else {
      localStorage.removeItem(KEY)
    }
  }, [accountIndex])

  const isDevMode = accountIndex !== null

  return { accountIndex, setAccountIndex, isDevMode }
}
