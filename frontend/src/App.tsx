import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import MintPage from './pages/MintPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import HelpPage from './pages/HelpPage'
import ConnectWallet from './components/ConnectWallet'
import LanguageSelect from './components/LanguageSelect'
import NetworkGuard from './components/NetworkGuard'
import { Toaster } from './components/Toast'
import { useCurrentGameId } from './hooks/useCurrentGameId'
import { useLastGame } from './hooks/useLastGame'
import { usePlayerIdentity } from './hooks/usePlayerIdentity'
import { useLanguage } from './i18n'

export default function App() {
  const { normalizedPlayerAddress } = usePlayerIdentity()
  const { gameId: lastGameId } = useLastGame(normalizedPlayerAddress)
  const { currentGameId } = useCurrentGameId(normalizedPlayerAddress)
  const { t } = useLanguage()
  const gameId = currentGameId ?? lastGameId

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-700">
          <span className="text-xl font-bold">Chinese Chess</span>
          <div className="flex gap-5 text-sm flex-wrap justify-center">
            <NavLink to="/"            className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>{t.nav.mint}</NavLink>
            <NavLink to="/lobby"       className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>{t.nav.lobby}</NavLink>
            {gameId && (
              <NavLink to={`/game/${gameId}`} className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>
                {t.nav.game} #{gameId}
              </NavLink>
            )}
            <NavLink to="/profile"     className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>{t.nav.profile}</NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>{t.nav.leaderboard}</NavLink>
            <NavLink to="/help"        className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>{t.nav.help}</NavLink>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelect />
            <ConnectWallet />
          </div>
        </nav>

        <NetworkGuard />

        <main className="p-6">
          <Routes>
            <Route path="/"             element={<MintPage />} />
            <Route path="/lobby"        element={<LobbyPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/profile"      element={<ProfilePage />} />
            <Route path="/leaderboard"  element={<LeaderboardPage />} />
            <Route path="/help"         element={<HelpPage />} />
          </Routes>
        </main>
      </div>

      <Toaster />
    </BrowserRouter>
  )
}
