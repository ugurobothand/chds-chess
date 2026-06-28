import { useCallback, useEffect, useState } from 'react'

const LEGACY_KEY = 'chds:last-game-id'
const MAP_KEY = 'chds:last-game-id-by-player'

type LastGameMap = Record<string, string>

function normalizePlayerKey(playerKey?: string | null) {
  return playerKey?.toLowerCase() ?? null
}

function readLastGameMap(): LastGameMap {
  try {
    const raw = localStorage.getItem(MAP_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as LastGameMap
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function writeLastGameMap(next: LastGameMap) {
  localStorage.setItem(MAP_KEY, JSON.stringify(next))
}

export function getLastGameId(playerKey?: string | null) {
  const normalized = normalizePlayerKey(playerKey)
  if (!normalized) return localStorage.getItem(LEGACY_KEY)

  const map = readLastGameMap()
  return map[normalized] ?? localStorage.getItem(LEGACY_KEY)
}

export function setLastGameId(gameId: string, playerKey?: string | null) {
  const normalized = normalizePlayerKey(playerKey)
  localStorage.setItem(LEGACY_KEY, gameId)

  if (!normalized) return

  const map = readLastGameMap()
  map[normalized] = gameId
  writeLastGameMap(map)
}

export function useLastGame(playerKey?: string | null) {
  const normalized = normalizePlayerKey(playerKey)
  const [gameId, setGameIdState] = useState<string | null>(() => getLastGameId(normalized))

  useEffect(() => {
    setGameIdState(getLastGameId(normalized))
  }, [normalized])

  useEffect(() => {
    function refresh() {
      setGameIdState(getLastGameId(normalized))
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [normalized])

  const saveGameId = useCallback((nextGameId: string) => {
    setLastGameId(nextGameId, normalized)
    setGameIdState(nextGameId)
  }, [normalized])

  return { gameId, saveGameId }
}
