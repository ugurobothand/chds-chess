import { useCallback, useEffect, useState } from 'react'

const KEY = 'chds:last-game-id'

export function getLastGameId() {
  return localStorage.getItem(KEY)
}

export function setLastGameId(gameId: string) {
  localStorage.setItem(KEY, gameId)
}

export function useLastGame() {
  const [gameId, setGameIdState] = useState<string | null>(() => getLastGameId())

  useEffect(() => {
    function refresh() {
      setGameIdState(getLastGameId())
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const saveGameId = useCallback((nextGameId: string) => {
    setLastGameId(nextGameId)
    setGameIdState(nextGameId)
  }, [])

  return { gameId, saveGameId }
}
