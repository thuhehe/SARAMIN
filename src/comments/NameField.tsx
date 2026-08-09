import { useId, useState } from 'react'
import { useComments } from './CommentsProvider'

/**
 * Asks once for a display name. Everyone unlocks with the same passcode,
 * so without this every comment would read "Guest" and the thread would
 * be useless for deciding who to ask. Stored locally and sent with each
 * post; changing it later only affects new comments.
 */
export function NameField({
  className,
  /** Optional control placed on its own row beneath the field. */
  action,
}: {
  className?: string
  action?: React.ReactNode
}) {
  const { name, setName } = useComments()
  const [value, setValue] = useState(name ?? '')
  // The rail can render this twice at once (footer + inside a card).
  const fieldId = useId()

  // The action sits outside the <label> on purpose: a button inside one
  // steals the click into "focus the input".
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <label
          htmlFor={fieldId}
          className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-faint"
        >
          Your name
        </label>
        <input
          id={fieldId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setName(value)}
          maxLength={80}
          placeholder="Put your name here"
          className="min-w-0 flex-1 rounded-lg border border-line bg-canvas/50 px-2.5 py-1.5 text-[12px] outline-none focus:border-brand"
        />
      </div>
      {action && <div className="mt-2 flex justify-end">{action}</div>}
    </div>
  )
}
