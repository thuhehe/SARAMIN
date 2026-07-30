import type { SpecTable } from '@/data/types'

/* A spec-section value grid. Same purpose as the requirement tables on a module
   page (ReqTableView in ModuleDetail) but styled like the field tables on a
   feature page, so a section table reads as part of the spec it sits in.
   First column is the value; the rest are its meaning / consequences. */
export function SpecTableView({ t }: { t: SpecTable }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-canvas/70 text-left text-[11px] uppercase tracking-wide text-muted">
            {t.cols.map((c, i) => (
              <th key={i} className="px-3 py-2 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, ri) => (
            <tr key={ri} className="border-t border-line-soft align-top">
              {r.map((cell, ci) => (
                <td key={ci} className={ci === 0 ? 'px-3 py-2 font-medium whitespace-nowrap' : 'px-3 py-2 text-muted'}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
