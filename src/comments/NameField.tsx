import { useState } from 'react'
import { useComments } from './CommentsProvider'

/**
 * Asks once for a display name. Everyone unlocks with the same passcode,
 * so without this every comment would read "Guest" and the thread would
 * be useless for deciding who to ask. Stored locally and sent with each
 * post; changing it later only affects new comments.
 */
export function NameField({ className }: { className?: string }) {
  const { name, setName } = useComments()
  const [value, setValue] = useState(name ?? '')

  return (
    <label className={className}>
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-faint">
        Your name
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setName(value)}
        maxLength={80}
        placeholder="e.g. Thương (BB)"
        className="w-full rounded-lg border border-line bg-canvas/50 px-2.5 py-1.5 text-[12px] outline-none focus:border-brand"
      />
    </label>
  )
}
