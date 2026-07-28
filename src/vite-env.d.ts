/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * BB PM API root, including `/api` — e.g.
   * `https://pm.burningbros.kr/api`. Leave unset to build the site with
   * the comment layer switched off entirely.
   */
  readonly VITE_BBPM_API_BASE?: string
  /**
   * Token of a `COMMENT`-scoped share link on the SRM project. Public by
   * design: it is half of the credential, useless without the passcode.
   */
  readonly VITE_BBPM_SHARE_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
