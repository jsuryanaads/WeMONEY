export function parseQuickInput(value) {
  const text = value.trim()
  if (!text) return { description: '', amount: 0 }

  const match = text.match(/(?:rp\.?\s*)?([0-9][0-9.,]*)\s*$/i)
  if (!match) return { description: text, amount: 0 }

  const rawAmount = match[1]
  const amount = Number(rawAmount.replace(/[.,]/g, ''))
  const description = text.slice(0, match.index).replace(/[,\-:]\s*$/, '').trim()
  return { description, amount: Number.isFinite(amount) ? amount : 0 }
}
