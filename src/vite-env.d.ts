/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME?: string;
  readonly VITE_AUDIO_BASE_URL?: string;
  readonly VITE_AUDIO_PATH_PREFIX?: string;
  readonly VITE_ARTWORK_PATH_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
