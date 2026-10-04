// Evaluates svn-web's auth copy modules and prints every string, flattened,
// so the curated screen map (copy-screens.mjs) can reference them by path.
import { build } from 'esbuild'
import path from 'node:path'

const WEB = process.env.SVN_WEB ?? path.resolve('../../svn-web')

export async function loadCopy() {
  const entry = `
    import vi from '@/dictionaries/vi.json'; import en from '@/dictionaries/en.json'; import ko from '@/dictionaries/ko.json'
    import * as auth from '@/features/auth/mock/copy'
    import * as signIn from '@/features/auth/sign-in/mock/copy'
    import * as signUp from '@/features/auth/sign-up/mock/copy'
    import * as join from '@/features/auth/member-join-detail/mock/copy'
    import * as phone from '@/features/auth/phone-verification/mock/copy'
    import * as recovery from '@/features/auth/recovery/mock/copy'
    import * as loginRequired from '@/features/auth/login-required/mock/copy'
    const dict = { vi, en, ko }
    export function get(locale) {
      return {
        dict: dict[locale],
        header: auth.getAuthHeaderCopy(locale),
        roleTabs: auth.getAuthRoleTabsCopy(locale),
        candidateRequired: auth.getCandidateRequiredCopy(locale),
        signUpPanel: auth.getSignUpPanelCopy(locale),
        signIn: signIn.getSignInCopy(locale),
        signUp: signUp.getSignUpEntryCopy(locale),
        join: join.getJoinDetailCopy(locale),
        phone: phone.getPhoneVerifyCopy(locale),
        recovery: recovery.getRecoveryCopy(locale),
        loginRequired: loginRequired.getLoginRequiredCopy(locale),
      }
    }`
  const res = await build({
    stdin: { contents: entry, resolveDir: WEB, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node',
    alias: { '@': WEB }, logLevel: 'error',
  })
  const code = res.outputFiles[0].text
  const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
  return { vi: mod.get('vi'), en: mod.get('en'), ko: mod.get('ko') }
}

export function flatten(obj, prefix = '', out = {}) {
  if (typeof obj === 'string') out[prefix] = obj
  else if (Array.isArray(obj)) obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out))
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { vi } = await loadCopy()
  const root = process.argv[2]
  const flat = flatten(root ? { [root]: vi[root] } : vi)
  for (const [k, v] of Object.entries(flat)) console.log(`${k}\t${v.replace(/\n/g, '⏎')}`)
}
