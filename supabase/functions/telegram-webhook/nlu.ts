import { EXPENSE_RULES, INCOME_RULES, INCOME_SIGNALS, EXPENSE_SIGNALS, normalize } from "https://raw.githubusercontent.com/jsuryanaads/WeMONEY/main/src/services/hybridAiRules.js";

const pad = (n:number) => String(n).padStart(2, "0");

export function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function shiftDate(iso:string, days=0, months=0) {
  const [y,m,d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (months) date.setUTCMonth(date.getUTCMonth() + months);
  if (days) date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())}`;
}

export function extractTransactionDate(text:string) {
  const t = normalize(text);
  const today = jakartaToday();
  if (/\\b(lusa)\\b/.test(t)) return shiftDate(today, 2);
  if (/\\b(kemarin|kemaren|yesterday)\\b/.test(t)) return shiftDate(today, -1);
  if (/\\b(2\\s+hari\\s+(?:yang\\s+)?lalu)\\b/.test(t)) return shiftDate(today, -2);
  if (/\\b(3\\s+hari\\s+(?:yang\\s+)?lalu)\\b/.test(t)) return shiftDate(today, -3);
  if (/\\b(minggu\\s+lalu|last\\s+week)\\b/.test(t)) return shiftDate(today, -7);
  if (/\\b(bulan\\s+lalu|last\\s+month)\\b/.test(t)) return shiftDate(today, 0, -1);
  if (/\\b(tadi|tadi\\s+(?:pagi|siang|sore|malam)|hari\\s+ini|today)\\b/.test(t)) return today;

  const explicit = t.match(/\\b(20\\d{2})[-\\/](\\d{1,2})[-\\/](\\d{1,2})\\b/);
  if (explicit) return `${explicit[1]}-${pad(Number(explicit[2]))}-${pad(Number(explicit[3]))}`;

  const dmy = t.match(/\\b(\\d{1,2})[\\/-](\\d{1,2})[\\/-](20\\d{2})\\b/);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;

  return today;
}

export function transactionDateLabel(iso:string) {
  const today = jakartaToday();
  if (iso === today) return "Hari ini";
  if (iso === shiftDate(today,-1)) return "Kemarin";
  return new Intl.DateTimeFormat("id-ID", { day:"numeric", month:"long", year:"numeric", timeZone:"Asia/Jakarta" }).format(new Date(`${iso}T12:00:00+07:00`));
}

export function normalizeNaturalLanguage(text:string) {
  let t = normalize(text);
  const replacements:Array<[RegExp,string]> = [
    [/\\broko\\b/g, "rokok"],
    [/\\brokok2\\b/g, "rokok"],
    [/\\bngerokok\\b/g, "rokok"],
    [/\\bmerokok\\b/g, "rokok"],
    [/\\bnyatet\\b/g, "mencatat"],
    [/\\bcatat\\b/g, "mencatat"],
    [/\\bmasukin\\b/g, "memasukkan"],
    [/\\bmasukan\\b/g, "memasukkan"],
    [/\\bngopi\\b/g, "kopi"],
    [/\\bjm\\b/g, "jam"],
  ];
  for (const [re,to] of replacements) t=t.replace(re,to);
  return t;
}

function signalScore(text:string, rules:Array<[string,string[]]>) {
  let score=0;
  for (const [term,weight] of rules === INCOME_RULES ? INCOME_SIGNALS : EXPENSE_SIGNALS) {
    if (text.includes(term)) score += weight;
  }
  for (const [,patterns] of rules) {
    for (const pattern of patterns) if (text.includes(normalize(pattern))) score += 5;
  }
  return score;
}

export function inferNaturalTransactionType(text:string) {
  const t=normalizeNaturalLanguage(text);
  const income=signalScore(t,INCOME_RULES);
  const expense=signalScore(t,EXPENSE_RULES);
  if (income>expense) return { type:"income" as const, confidence:Math.min(.98,.58+(income-expense)*.07) };
  if (expense>income) return { type:"expense" as const, confidence:Math.min(.98,.58+(expense-income)*.07) };
  return { type:"expense" as const, confidence:.35 };
}

export function extractAmount(text:string) {
  const source = normalize(text).replace(/rp\\.?/g, "").trim();
  const matches = source.match(/\\b\\d[\\d.,]*\\s*(?:juta|jt|ribu|rb|k|m)?\\b/gi) || [];
  for (const raw of matches) {
    const compact = raw.replace(/\\s+/g,"");
    const m = compact.match(/^(\\d[\\d.,]*?)(juta|jt|ribu|rb|k|m)?$/i);
    if (!m) continue;
    let n = m[1];
    if (/\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?$/.test(n)) n=n.replace(/\\./g,"").replace(",",".");
    else if (/\\d+[, ]\\d{1,2}$/.test(n)) n=n.replace(",",".");
    else if (/^\\d+\\.\\d{3}$/.test(n)) n=n.replace(".","");
    else n=n.replace(/,/g,"");
    let value=Number(n);
    if (!Number.isFinite(value)) continue;
    const unit=(m[2]||"").toLowerCase();
    if (["juta","jt","m"].includes(unit)) value*=1e6;
    if (["ribu","rb","k"].includes(unit)) value*=1e3;
    if (value>0) return Math.round(value);
  }
  return null;
}

export function parseNaturalTransaction(text:string) {
  const amount=extractAmount(text);
  if (!amount) return null;
  const type=inferNaturalTransactionType(text);
  const transaction_date=extractTransactionDate(text);
  const description=text.trim().slice(0,180) || "Transaksi Telegram";
  return { type:type.type, amount, transaction_date, description, confidence:type.confidence };
}
