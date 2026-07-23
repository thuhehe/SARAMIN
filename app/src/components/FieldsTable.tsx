import type { Field } from '@/data/types'

export function FieldsTable({ items }: { items: Field[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="bg-canvas/70 text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-semibold">Field</th>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="px-3 py-2 font-semibold w-14 text-center">Req.</th>
            <th className="px-3 py-2 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((f, i) => (
            <tr key={`${f.name}-${i}`} className="border-t border-line-soft align-top">
              <td className="px-3 py-2 font-medium">{f.name}</td>
              <td className="px-3 py-2">
                <code className="rounded bg-canvas px-1.5 py-0.5 text-[11px] text-ink/70">
                  {f.type}
                </code>
              </td>
              <td className="px-3 py-2 text-center">
                {f.required ? (
                  <span className="text-rose-600" title="Required">
                    ●
                  </span>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted">{f.notes ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
