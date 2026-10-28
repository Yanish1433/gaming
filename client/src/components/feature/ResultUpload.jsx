import { useEffect, useRef, useState } from 'react'
import { ImageUp } from 'lucide-react'
import Button from '../ui/Button'
import { Segmented } from '../ui/Input'
import { FormError } from '../ui/Empty'

// winnerSide + screenshot → multipart POST, done by the parent's onSubmit(formData)
// `players` = usernames on the reporter's own side; each gets a score box labelled with the game's statLabel
export default function ResultUpload({ onSubmit, busy, error, sideALabel = 'Team A', sideBLabel = 'Team B', players = [], statLabel = 'Kills' }) {
  const [side, setSide] = useState('')
  const [scores, setScores] = useState({})
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [localErr, setLocalErr] = useState(null)
  const input = useRef(null)

  useEffect(() => {
    if (!file) return setPreview('')
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setLocalErr(new Error('Screenshot must be an image.'))
    if (f.size > 5 * 1024 * 1024) return setLocalErr(new Error('Max 5 MB. Crop it or send a smaller one.'))
    setLocalErr(null)
    setFile(f)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!side) return setLocalErr(new Error('Who won? Pick a side.'))
    if (!file) return setLocalErr(new Error('Attach the end-of-match screenshot.'))
    const missing = players.find((p) => scores[p] === undefined || scores[p] === '')
    if (missing) return setLocalErr(new Error(`Enter ${statLabel.toLowerCase()} for ${missing} (0 is fine).`))
    const fd = new FormData()
    fd.append('winnerSide', side)
    fd.append('screenshot', file)
    if (players.length) fd.append('scores', JSON.stringify(players.map((username) => ({ username, score: Math.max(0, Number(scores[username]) || 0) }))))
    onSubmit(fd)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Segmented
        label="Winner"
        value={side}
        onChange={setSide}
        options={[
          { value: 'A', label: sideALabel },
          { value: 'B', label: sideBLabel },
        ]}
      />
      {players.length > 0 && (
        <fieldset>
          <legend className="font-mono text-[11px] font-semibold uppercase tracking-widest text-paper/60">Your side's {statLabel.toLowerCase()}</legend>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {players.map((p) => (
              <label key={p} className="flex items-center gap-3 border-2 border-paper/15 px-3 py-2 focus-within:border-marigold">
                <span className="min-w-0 flex-1 truncate font-semibold">{p}</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  inputMode="numeric"
                  value={scores[p] ?? ''}
                  onChange={(e) => setScores({ ...scores, [p]: e.target.value })}
                  placeholder="0"
                  className="h-9 w-16 bg-ink-2 text-center font-mono text-lg outline-none"
                  aria-label={`${statLabel} for ${p}`}
                />
                <span className="font-mono text-[10px] uppercase text-paper/45">{statLabel}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          pick(e.dataTransfer.files?.[0])
        }}
        className="relative flex min-h-36 w-full flex-col items-center justify-center gap-2 overflow-hidden border-2 border-dashed border-paper/30 p-4 text-paper/70 hover:border-marigold hover:text-paper"
      >
        {preview ? (
          <img src={preview} alt="Screenshot preview" className="max-h-48 object-contain" />
        ) : (
          <>
            <ImageUp className="size-7" aria-hidden />
            <span className="font-semibold">Drop the result screenshot</span>
            <span className="font-mono text-xs text-paper/45">PNG / JPG · max 5 MB</span>
          </>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <FormError error={localErr || error} />
      <Button type="submit" busy={busy} className="w-full sm:w-auto">
        Submit result
      </Button>
      <p className="text-xs text-paper/45">Both sides report their own players' numbers. If you agree on the winner it settles itself; if not, an admin looks at the screenshots.</p>
    </form>
  )
}
