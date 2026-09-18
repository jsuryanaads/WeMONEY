export type TelegramIntent =
  | "transaction" | "balance" | "expense_summary" | "income_summary"
  | "budget" | "wallets" | "help" | "unknown";

const normalize = (value: unknown) =>
  String(value || "").toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));

/**
 * Local-first Telegram intent router.
 * It only routes requests; it never invents financial facts.
 */
export function routeTelegramIntent(text: string): TelegramIntent {
  const t = normalize(text);
  if (!t) return "unknown";

  if (includesAny(t, ["saldo", "balance", "uang saya", "duit saya", "sisa uang", "sisa saldo"])) return "balance";
  if (includesAny(t, ["pengeluaran", "uang keluar", "habis berapa", "keluar berapa", "belanja bulan"])) return "expense_summary";
  if (includesAny(t, ["pemasukan", "pendapatan", "uang masuk", "income", "masuk berapa", "gaji bulan"])) return "income_summary";
  if (includesAny(t, ["budget", "anggaran"])) return "budget";
  if (includesAny(t, ["dompet", "wallet", "kas saya", "rekening saya"])) return "wallets";
  if (includesAny(t, ["bantuan", "help", "cara pakai", "perintah", "command", "menu", "apa saja", "bisa apa", "bisa apa saja", "kamu bisa", "yang bisa kamu", "fitur apa", "fiturnya apa"])) return "help";

  if (/(?:rp\.?\s*)?\d[\d.,]*\s*(?:juta|jt|ribu|rb|k|m)?/i.test(t)) return "transaction";
  if (includesAny(t, ["beli ", "bayar ", "membayar ", "pemasukan ", "pengeluaran ", "uang masuk ", "uang keluar "])) return "transaction";

  return "unknown";
}

export function monthBounds(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

export function monthLabel(now = new Date()) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(now);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function summarizeTransactions(rows: Array<{ type: string; amount: number; category?: { name?: string } | null }>) {
  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();
  for (const row of rows) {
    const amount = Number(row.amount) || 0;
    if (row.type === "income") income += amount;
    if (row.type === "expense") {
      expense += amount;
      const category = row.category?.name || "Tanpa kategori";
      byCategory.set(category, (byCategory.get(category) || 0) + amount);
    }
  }
  return { income, expense, net: income - expense, byCategory };
}

export function renderIntentHelp() {
  return [
    "🤖 *WeMONEY Assistant*",
    "",
    "Saya bisa membantu mencatat dan membaca data keuangan Anda:",
    "• beli makan 25rb — catat pengeluaran",
    "• uang masuk dari usaha 500rb — catat pemasukan",
    "• saldo saya — lihat saldo dompet",
    "• pengeluaran bulan ini — ringkasan pengeluaran",
    "• pemasukan bulan ini — ringkasan pemasukan",
    "• budget bulan ini — lihat anggaran",
    "• dompet saya — daftar dompet",
    "",
    "Transaksi tetap meminta konfirmasi sebelum disimpan.",
  ].join("\n");
}
