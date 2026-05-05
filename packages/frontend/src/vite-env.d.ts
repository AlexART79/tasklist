/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_LOG_FORMAT?: string;
  readonly VITE_LOG_BUFFER_SIZE?: string;
  readonly VITE_LOG_DEBUG_PANEL?: string;
}
