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
    import { makeJoinDetailSchema, MIN_SIGNUP_AGE_YEARS } from '@/features/auth/member-join-detail/schemas/join-detail.schema'
    import { makeSignInSchema } from '@/features/auth/sign-in/schemas/sign-in.schema'
    import { makeRecoveryPhoneSchema, makeRecoveryEmailSchema, makeRecoveryPasswordSchema } from '@/features/auth/recovery/schemas/recovery.schema'
    import { makeResetPasswordSchema } from '@/features/auth/reset-password/schemas/reset-password.schema'
    import { contentUiStrings } from '@/features/content/services/banner.service'
    const dict = { vi, en, ko }

    // The schema files keep their messages in a module-private MESSAGES table, so they are
    // read the only way the UI can read them: by running the exported schema factory on an
    // input that breaks exactly ONE rule and taking the message zod reports on that field.
    // A probe that yields no message, or more than one, fails the build — so a renamed rule
    // or a changed check cannot silently drop a string from the review.
    // \`first\`: the screen itself shows issues[0] (forgot-password's identity step does), so
    // a probe for that screen may see several and keep the first, exactly as the UI does.
    function probe(schema, base, patch, field, { first = false } = {}) {
      const res = schema.safeParse({ ...base, ...patch })
      const issues = res.success ? [] : res.error.issues.filter((i) => i.path[0] === field)
      const msgs = [...new Set(issues.map((i) => i.message))]
      if (first && msgs.length > 1) msgs.length = 1
      if (msgs.length !== 1) throw new Error('probe ' + field + ' ' + JSON.stringify(patch) + ' → ' + JSON.stringify(msgs))
      return msgs[0]
    }
    function vnYearsAgo(years) {
      const d = new Date(); d.setFullYear(d.getFullYear() - years)
      return d.toISOString().slice(0, 10)
    }
    function joinSchemaMessages(locale) {
      const s = makeJoinDetailSchema(locale)
      const base = {
        fullName: 'Nguyen Van A', password: 'Abcdef1!', email: 'someone@example.com', terms: true,
        locationService: false, marketingEmail: false, marketingSms: false, phoneCountryCode: '+84',
        phone: '912345678', overseasResident: false, phoneVerificationToken: 'proof',
        emailVerificationToken: null, dateOfBirth: '1990-01-01',
      }
      const abroad = { overseasResident: true, phoneVerificationToken: null, emailVerificationToken: 'proof' }
      return {
        fullNameRequired: probe(s, base, { fullName: '' }, 'fullName'),
        fullNameMin: probe(s, base, { fullName: 'A' }, 'fullName'),
        fullNameMax: probe(s, base, { fullName: 'A'.repeat(101) }, 'fullName'),
        fullNameFormat: probe(s, base, { fullName: 'An1' }, 'fullName'),
        emailRequired: probe(s, base, { email: '' }, 'email'),
        emailInvalid: probe(s, base, { email: 'someone' }, 'email'),
        emailUnverified: probe(s, base, { ...abroad, emailVerificationToken: null }, 'email'),
        passwordMin: probe(s, base, { password: 'Ab1!' }, 'password'),
        passwordMax: probe(s, base, { password: 'Ab1!' + 'a'.repeat(130) }, 'password'),
        passwordDigit: probe(s, base, { password: 'Abcdefg!' }, 'password'),
        passwordSymbol: probe(s, base, { password: 'Abcdefg1' }, 'password'),
        passwordUppercase: probe(s, base, { password: 'abcdefg1!' }, 'password'),
        passwordEqualsEmail: probe(s, base, { password: 'Abcd1@x.co', email: 'abcd1@x.co' }, 'password'),
        phoneRequired: probe(s, base, { phone: '' }, 'phone'),
        phoneFormat: probe(s, base, { phone: '123' }, 'phone'),
        phoneUnverified: probe(s, base, { phoneVerificationToken: null }, 'phone'),
        phoneAbroadFormat: probe(s, base, { ...abroad, phone: '12' }, 'phone'),
        dobRequired: probe(s, base, { dateOfBirth: '' }, 'dateOfBirth'),
        dobFuture: probe(s, base, { dateOfBirth: '2999-01-01' }, 'dateOfBirth'),
        dobImplausible: probe(s, base, { dateOfBirth: '1850-01-01' }, 'dateOfBirth'),
        dobMinAge: probe(s, base, { dateOfBirth: vnYearsAgo(MIN_SIGNUP_AGE_YEARS - 1) }, 'dateOfBirth'),
        termsRequired: probe(s, base, { terms: false }, 'terms'),
      }
    }
    function signInSchemaMessages(locale) {
      const s = makeSignInSchema(locale)
      const base = { memberType: 'individual', email: 'someone@example.com', password: 'x' }
      return {
        emailInvalid: probe(s, base, { email: 'someone' }, 'email'),
        passwordRequired: probe(s, base, { password: '' }, 'password'),
        passwordMax: probe(s, base, { password: 'a'.repeat(73) }, 'password'),
      }
    }
    function recoverySchemaMessages(locale) {
      const phone = makeRecoveryPhoneSchema(locale)
      const email = makeRecoveryEmailSchema(locale)
      const pw = makeRecoveryPasswordSchema(locale)
      const pwBase = { newPassword: 'Abcdef1!', confirmPassword: '' }
      return {
        phoneRequired: probe(phone, {}, { phone: '' }, 'phone', { first: true }),
        phoneFormat: probe(phone, {}, { phone: '123' }, 'phone'),
        emailRequired: probe(email, {}, { email: '' }, 'email', { first: true }),
        emailFormat: probe(email, {}, { email: 'someone' }, 'email'),
        passwordLength: probe(pw, pwBase, { newPassword: 'Ab1!' }, 'newPassword'),
        passwordDigit: probe(pw, pwBase, { newPassword: 'Abcdefg!' }, 'newPassword'),
        passwordSymbol: probe(pw, pwBase, { newPassword: 'Abcdefg1' }, 'newPassword'),
        passwordUppercase: probe(pw, pwBase, { newPassword: 'abcdefg1!' }, 'newPassword'),
      }
    }
    function resetSchemaMessages(locale) {
      const s = makeResetPasswordSchema(locale)
      const base = { newPassword: 'Abcdef1!' }
      return {
        passwordMin: probe(s, base, { newPassword: 'Ab1!' }, 'newPassword'),
        passwordMax: probe(s, base, { newPassword: 'Ab1!' + 'a'.repeat(130) }, 'newPassword'),
        passwordNoSpace: probe(s, base, { newPassword: ' Abcdef1!' }, 'newPassword'),
        passwordLetterDigit: probe(s, base, { newPassword: 'Abcdefg!' }, 'newPassword'),
        passwordSymbol: probe(s, base, { newPassword: 'Abcdefg1' }, 'newPassword'),
      }
    }

    export function get(locale) {
      return {
        joinSchema: joinSchemaMessages(locale),
        signInSchema: signInSchemaMessages(locale),
        recoverySchema: recoverySchemaMessages(locale),
        resetSchema: resetSchemaMessages(locale),
        content: { bannerLinkLabel: contentUiStrings(locale).bannerLinkLabel },
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
    // svn-web is read without its own node_modules, so its one runtime dependency the copy
    // needs (zod, for the schema probes above) resolves from this package's. Not in
    // package.json yet: `npm i -D zod@^4` here, or `npm i --no-save zod@^4` for a one-off run.
    nodePaths: [path.resolve('node_modules')],
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
