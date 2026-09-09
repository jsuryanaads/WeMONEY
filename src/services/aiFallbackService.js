import { supabase } from '../lib/supabase'

export const AI_FALLBACK_THRESHOLD = 0.7

export function shouldUseAiFallback(classification) {
  return Number(classification?.classificationConfidence || 0) < AI_FALLBACK_THRESHOLD
}

export async function classifyWithFreeAiFallback({ text = '', amount = 0, date = '', merchant = '', categories = [], wallets = [], localClassification } = {}) {
  if (!shouldUseAiFallback(localClassification)) return localClassification
  try {
    const { data, error } = await supabase.functions.invoke('ai-fallback', {
      body: { text, amount, date, merchant, categories, wallets },
    })
    if (error || !data?.ok || !data?.result) return localClassification
    return {
      ...localClassification,
      ...data.result,
      amount: Number(data.result.amount || amount || localClassification.amount || 0),
      transaction_date: data.result.transaction_date || date || localClassification.transaction_date,
      description: data.result.description || localClassification.description,
      merchant: data.result.merchant || merchant || localClassification.merchant,
      categoryId: data.result.categoryId || localClassification.categoryId,
      walletId: data.result.walletId || localClassification.walletId,
      classificationSource: `hybrid-local→${data.provider || 'free-cloud'}`,
      classificationExplanation: `${data.result.classificationExplanation || 'Saran dari AI cloud gratis.'} Tetap periksa sebelum menyimpan.`,
    }
  } catch {
    return localClassification
  }
}

export async function classifyTransactionWithFallback({ classifyLocal, ...input } = {}) {
  const local = classifyLocal(input)
  return classifyWithFreeAiFallback({ ...input, localClassification: local })
}
