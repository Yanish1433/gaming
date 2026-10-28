// Small helpers for human-readable audit summaries (never raw request JSON).

export const onOff = (v) => (v ? 'ON' : 'OFF');

export function clip(text, max = 40) {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// "label a -> b" for each field whose value changed; `fmt` formats values per field.
export function diffFields(before, after, labels, fmt = {}) {
  return Object.entries(labels)
    .filter(([key]) => String(before[key]) !== String(after[key]))
    .map(([key, label]) => {
      const f = fmt[key] ?? ((v) => v);
      return `${label} ${f(before[key])} -> ${f(after[key])}`;
    });
}

export const joinChanges = (subject, changes) => `${subject}: ${changes.length ? changes.join(', ') : 'no changes'}`;
