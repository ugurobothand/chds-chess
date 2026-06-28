import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import MintPage from './pages/MintPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ConnectWallet from './components/ConnectWallet'
import NetworkGuard from './components/NetworkGuard'
import { Toaster } from './components/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <span className="text-xl font-bold">Chinese Chess</span>
          <div className="flex gap-6 text-sm">
            <NavLink to="/"            className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>Mint</NavLink>
            <NavLink to="/lobby"       className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>Lobby</NavLink>
            <NavLink to="/profile"     className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>Profile</NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}>Leaderboard</NavLink>
          </div>
          <ConnectWallet />
        </nav>

        <NetworkGuard />

        <main className="p-6">
          <Routes>
            <Route path="/"             element={<MintPage />} />
            <Route path="/lobby"        element={<LobbyPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/profile"      element={<ProfilePage />} />
            <Route path="/leaderboard"  element={<LeaderboardPage />} />
          </Routes>
        </main>
      </div>

      <Toaster />
    </BrowserRouter>
  )
}
