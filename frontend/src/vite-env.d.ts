/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHESS_PASS_ADDRESS:      string
  readonly VITE_CHESS_LOBBY_ADDRESS:     string
  readonly VITE_CHINESE_CHESS_ADDRESS:   string
  readonly VITE_ARBITRUM_RPC:            string
  readonly VITE_ARBITRUM_SEPOLIA_RPC:    string
  readonly VITE_CONTRACT_DEPLOY_BLOCK:   string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
