import { getObligations } from './obligationService'
import { calculateBudgetUsage, getBudgetPeriodEnd, getBudgets } from './budgetService'
import { getTransactionsForPeriod } from './transactionService'

function localDateIso(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function money(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
}

function dueText(dueDate, today) {
  const diff = Math.round((new Date(`${dueDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000)
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`
  if (diff === 0) return 'Jatuh tempo hari ini'
  if (diff === 1) return 'Jatuh tempo besok'
  return `Jatuh tempo ${diff} hari lagi`
}

export async function getFinancialNotifications(userId) {
  if (!userId) return []
  const today = localDateIso()
  const soon = localDateIso(addDays(new Date(), 3))
  const notifications = []

  const obligations = await getObligations(userId, { status: 'open' })
  obligations
    .filter(item => item.due_date && item.due_date <= soon)
    .forEach(item => {
      const overdue = item.due_date < today
      const remaining = Math.max(0, Number(item.amount_total || 0) - Number(item.amount_paid || 0))
      notifications.push({
        id: `obligation-${item.id}-${item.due_date}`,
        type: overdue ? 'danger' : 'warning',
        title: overdue ? 'Kewajiban terlambat' : 'Jatuh tempo mendekat',
        message: `${item.title} • ${money(remaining)} • ${dueText(item.due_date, today)}`,
        date: item.due_date,
        action: '/hutang-tagihan',
        actionLabel: 'Buka Hutang & Tagihan',
      })
    })

  const budgets = (await getBudgets(userId, { activeOnly: true }))
    .filter(item => item.start_date <= today && getBudgetPeriodEnd(item) >= today)

  if (budgets.length) {
    const starts = budgets.map(item => item.start_date).sort()
    const end = budgets.map(item => getBudgetPeriodEnd(item)).sort().at(-1)
    const transactions = await getTransactionsForPeriod(userId, starts[0], end)

    budgets.forEach(budget => {
      const usage = calculateBudgetUsage(budget, transactions)
      if (usage.exceeded || usage.percent >= 80) {
        notifications.push({
          id: `budget-${budget.id}-${today}-${usage.percent >= 100 ? '100' : '80'}`,
          type: usage.exceeded ? 'danger' : 'warning',
          title: usage.exceeded ? 'Anggaran terlampaui' : 'Anggaran hampir habis',
          message: `${budget.name} • ${usage.percent.toFixed(0)}% terpakai • ${money(usage.actual)} dari ${money(budget.amount)}`,
          date: today,
          action: '/anggaran',
          actionLabel: 'Buka Anggaran',
        })
      }
    })
  }

  return notifications
}
