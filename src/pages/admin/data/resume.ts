/*
 * The Saramin standard resume: its shape, the convert pipeline, and the seeds both
 * intake routes converge on.
 */
import { useEffect, useState } from 'react'

/* ── Create resume (Admin) ────────────────────────────────────────────────────
   Two routes into ONE object, converging on the Saramin standard review screen:

     ① Upload CV  → CV Convert pipeline (parse → extract → AI tag → generate)
     ② Builder    → 4-step wizard (basics → headline & body → AI tags → preview)

   Neither route writes to the resume master. "Register to resume master" on the
   convergence screen is the only write in the whole flow, which is why switching
   paths or abandoning half-way costs nothing.

   The route decides only two things: `source` (IMPORT vs SELF_REGISTER) and the
   document set (Upload carries the original PDF too). Everything downstream —
   the review screen, the standard JSON, the matching keys — is identical. */

export const CONVERT_STEPS = [
  { n: '①', title: 'Parse PDF', desc: 'Extract text and layout from the original CV.', ms: 1200 },
  { n: '②', title: 'Extract structured fields', desc: 'Map name, contact, experience, education, skills to the Saramin schema.', ms: 1500 },
  { n: '③', title: 'AI tag suggestions', desc: 'Suggest skill / role / domain tags. Reviewable by operators.', ms: 1800 },
  { n: '④', title: 'Generate Saramin-standard resume', desc: 'Create a new Saramin CV PDF from the standard template.', ms: 1400 },
]

/** The one canonical suggestion set, shared by the pipeline's step ③ and the
    Builder's tag step — so both routes visibly converge on identical tags. */
export const SUGGESTED_TAGS: { kind: 'Skill' | 'Role' | 'Domain'; value: string; conf: number }[] = [
  { kind: 'Skill', value: 'React', conf: 0.97 },
  { kind: 'Skill', value: 'Next.js', conf: 0.94 },
  { kind: 'Skill', value: 'TypeScript', conf: 0.93 },
  { kind: 'Skill', value: 'Tailwind CSS', conf: 0.86 },
  { kind: 'Skill', value: 'GraphQL', conf: 0.78 },
  { kind: 'Role', value: 'Frontend Engineer', conf: 0.95 },
  { kind: 'Domain', value: 'E-commerce', conf: 0.82 },
]
/** Confidence at or above this auto-applies; below it goes to the operator queue. */
export const AUTO_APPLY = 0.8

export const EXTRACTED_FIELDS: [string, string][] = [
  ['Headline', 'Frontend Engineer | React + Next.js | 3y exp'],
  ['Location', 'Hà Nội, Việt Nam'],
  ['Experience', 'Tiki (2023.03~), Sendo (2022.01~2023.02)'],
  ['Education', 'HUST · B.S. Computer Science'],
]

/** Drives the pipeline on a timer: idle → running(0..3) → done. */
export function useConvertProgress() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (phase !== 'running') return
    const cur = CONVERT_STEPS[step]
    if (!cur) return
    const t = setTimeout(() => {
      // The last step's timer flips to done, so the effect body stays free of a
      // synchronous setState.
      if (step + 1 >= CONVERT_STEPS.length) setPhase('done')
      else setStep((i) => i + 1)
    }, cur.ms)
    return () => clearTimeout(t)
  }, [phase, step])
  return {
    phase,
    step,
    start: () => { setPhase('running'); setStep(0) },
    reset: () => { setPhase('idle'); setStep(-1) },
  }
}

/* ── the standard model, as the prototype carries it ─────────────────────────── */
type StdExp = { company: string; position: string; location: string; startYm: string; endYm: string; areas: string; bullets: string[]; tech: string }
type StdEdu = { school: string; faculty: string; major: string; degree: string; startYm: string; endYm: string; gpa: string }
type StdLang = { language: string; cert: string; score: string; level: string }
export type Prefs = {
  careerLevel: string; yearsOfExp: string; cats: string; empTypes: string
  locs: string; inds: string; salKind: string; salCur: string; salMin: string; salMax: string
  remoteOk: boolean; relocate: boolean; overseas: boolean
}
export type Std = {
  nameVi: string; nameEn: string; nameKr: string; dob: string; gender: string
  email: string; phone: string; city: string; district: string; road: string
  sumVi: string; sumEn: string; sumKo: string
  experiences: StdExp[]; educations: StdEdu[]
  skills: { group: string; items: string }[]
  languages: StdLang[]
  certifications: { name: string; issuer: string; year: string; score: string }[]
  projects: { name: string; role: string; period: string; tech: string }[]
  awards: { name: string; year: string; issuer: string }[]
  references: { name: string; role: string; relation: string; phone: string }[]
  links: { kind: string; url: string }[]
  prefs: Prefs
  tags: { kind: string; value: string; conf: number }[]
}

const EMPTY_PREFS: Prefs = {
  careerLevel: 'ANY', yearsOfExp: '0', cats: '', empTypes: '', locs: '', inds: '',
  salKind: '', salCur: 'VND', salMin: '', salMax: '', remoteOk: false, relocate: false, overseas: false,
}

/** What the Upload route hands to the review screen — a fully-extracted resume. */
export function importedStd(): Std {
  return {
    nameVi: 'Nguyễn Văn An', nameEn: 'Nguyen Van An', nameKr: '응우옌 반 안',
    dob: '1998-04-12', gender: 'M', email: 'nguyen.an@example.vn', phone: '+84 90 123 4567',
    city: 'Hà Nội', district: 'Cầu Giấy', road: 'Trần Thái Tông',
    sumVi: 'Frontend Engineer 3 năm kinh nghiệm với React, Next.js, TypeScript. Tập trung vào performance và DX cho hệ thống lớn.',
    sumEn: 'Frontend Engineer with 3 years of experience in React, Next.js, TypeScript. Focused on performance and DX at scale.',
    sumKo: 'React, Next.js, TypeScript 기반 프론트엔드 엔지니어 3년차. 대규모 서비스의 성능과 DX 개선에 집중합니다.',
    experiences: [
      { company: 'Tiki', position: 'Frontend Engineer', location: 'Hồ Chí Minh', startYm: '2023-03', endYm: '', areas: 'Storefront', tech: 'React, Next.js, TypeScript, Tailwind', bullets: ['Migrated the legacy jQuery checkout to React 18 + App Router', 'Owned the performance budget — cut TTI 35% on SKU listing', 'Mentored 2 juniors on Server Component patterns'] },
      { company: 'Sendo', position: 'Junior Web Developer', location: 'Hồ Chí Minh', startYm: '2022-01', endYm: '2023-02', areas: 'Admin', tech: 'Vue 3, Pinia, Vite', bullets: ['Built seller admin dashboards on Vue 3 + Pinia', 'Cut bundle size 28% via code-splitting'] },
    ],
    educations: [{ school: 'Hanoi University of Science and Technology', faculty: 'School of ICT', major: 'Computer Science', degree: 'BACHELOR', startYm: '2018-09', endYm: '2022-07', gpa: '3.4 / 4.0' }],
    skills: [
      { group: 'Frontend', items: 'React, Next.js, TypeScript, Tailwind, GraphQL' },
      { group: 'State & Data', items: 'Redux, TanStack Query, Zustand' },
      { group: 'Tools', items: 'Git, Figma, Vercel, Sentry' },
      { group: 'Soft skills', items: 'Mentoring, Cross-team collaboration' },
    ],
    languages: [
      { language: 'vi', cert: '', score: '', level: 'NATIVE' },
      { language: 'en', cert: 'TOEIC', score: '850', level: 'ADVANCED' },
      { language: 'ko', cert: 'TOPIK', score: '4급', level: 'INTERMEDIATE' },
    ],
    certifications: [
      { name: 'MOS Excel', issuer: 'Microsoft', year: '2021', score: '960' },
      { name: 'AWS Cloud Practitioner', issuer: 'Amazon', year: '2024', score: '' },
    ],
    projects: [{ name: 'Tiki Storefront PPR migration', role: 'Lead Frontend', period: '2024-04 → 2024-09', tech: 'Next.js, React Server Components' }],
    awards: [{ name: 'Best Performance Contribution Q3', year: '2024', issuer: 'Tiki' }],
    references: [{ name: 'Trần Minh Hiếu', role: 'Engineering Manager, Tiki', relation: 'Direct manager', phone: '+84 90 555 1234' }],
    links: [{ kind: 'github', url: 'https://github.com/nguyen-an' }, { kind: 'linkedin', url: 'https://linkedin.com/in/nguyen-an' }],
    prefs: {
      careerLevel: 'EXPERIENCED', yearsOfExp: '3', cats: 'Frontend Developer, Full-stack Developer',
      empTypes: 'FULL_TIME', locs: 'Hà Nội, Hồ Chí Minh', inds: 'E-commerce, SaaS',
      salKind: 'MONTHLY', salCur: 'VND', salMin: '30000000', salMax: '45000000',
      remoteOk: true, relocate: false, overseas: false,
    },
    tags: SUGGESTED_TAGS.filter((t) => t.conf >= AUTO_APPLY).map((t) => ({ kind: t.kind, value: t.value, conf: t.conf })),
  }
}

/** What the Builder route hands over: the typed free text folded into the model.
    Headline + body become the VI summary, location becomes the address city, and
    each checked tag becomes a Skill tag. Everything else starts EMPTY — which is
    why so many matching keys read Missing on this route. */
export function builderStd(f: { fullName: string; email: string; phone: string; location: string; headline: string; body: string; tags: string[] }): Std {
  return {
    nameVi: f.fullName, nameEn: '', nameKr: '', dob: '', gender: '',
    email: f.email, phone: f.phone, city: f.location, district: '', road: '',
    sumVi: f.headline ? `${f.headline}\n\n${f.body}` : f.body, sumEn: '', sumKo: '',
    experiences: [], educations: [], skills: [], languages: [], certifications: [],
    projects: [], awards: [], references: [], links: [],
    prefs: { ...EMPTY_PREFS },
    tags: f.tags.map((value) => ({ kind: 'Skill', value, conf: 0.95 })),
  }
}

/* ── Job matching keys ────────────────────────────────────────────────────────
   Nine derived readiness indicators, named after the JOB-POSTING filters rather
   than the resume's own fields — because the question they answer is "which job
   filters can this resume be found by?". Recomputed on every keystroke, so a key
   flips to Ready as the operator fills the section that feeds it. */
export function matchKeys(s: Std): { label: string; ready: boolean; preview: string }[] {
  const list = (csv: string) => csv.split(',').map((x) => x.trim()).filter(Boolean)
  const first3 = (csv: string) => list(csv).slice(0, 3).join(' · ') || '—'
  const p = s.prefs
  const edu = s.educations[0]
  const salReady = p.salKind === 'INTERVIEW' || p.salMin.trim() !== ''
  const workTypes = [p.remoteOk && 'remote', p.overseas && 'oversea'].filter(Boolean).join(' · ')
  return [
    { label: 'Job categories', ready: list(p.cats).length > 0, preview: first3(p.cats) },
    { label: 'Career', ready: p.careerLevel !== 'ANY' || Number(p.yearsOfExp) > 0, preview: p.careerLevel === 'EXPERIENCED' ? `${p.careerLevel} · ${p.yearsOfExp}y` : p.careerLevel },
    { label: 'Education', ready: !!edu, preview: edu ? `${edu.degree} · ${edu.school}` : '—' },
    { label: 'Industries', ready: list(p.inds).length > 0, preview: first3(p.inds) },
    { label: 'Language certs', ready: s.languages.length > 0, preview: s.languages.map((l) => [l.language, l.cert, l.score].filter(Boolean).join(':')).slice(0, 3).join(' · ') || '—' },
    { label: 'Salary', ready: salReady, preview: p.salKind === 'INTERVIEW' ? 'INTERVIEW' : p.salMin ? `${p.salMin}~${p.salMax || '?'} ${p.salCur}` : '—' },
    { label: 'Locations', ready: list(p.locs).length > 0, preview: first3(p.locs) },
    { label: 'Work types', ready: !!workTypes, preview: workTypes || '—' },
    { label: 'Willing to relocate', ready: p.relocate, preview: p.relocate ? 'Yes' : '—' },
  ]
}

/* ── ② Builder route — 4-step wizard with gates ──────────────────────────────── */

export const BUILDER_STEPS = [
  { key: 'personal', label: 'Personal info', desc: 'Who the candidate is and how to reach them.' },
  { key: 'content', label: 'Headline & content', desc: 'Summarise the experience for recruiters.' },
  { key: 'tags', label: 'AI tags', desc: 'AI analyses the body and suggests Saramin-standard tags. Operator review applies.' },
  { key: 'preview', label: 'Preview & submit', desc: 'Read back the information before handing off to the standard review screen.' },
] as const

export type BuilderForm = { fullName: string; email: string; phone: string; location: string; headline: string; body: string; tags: string[] }
