import type { Currency } from "./currencies";
import type { Interval } from "./types";
import { toISO } from "./format";

export interface ParsedInvoice {
  name: string;
  amount: number;
  currency: Currency;
  interval: Interval;
  next_billing_date: string;
  suggested_category?: string;
  confidence: number; // 0 - 100
  raw_snippet?: string;
}

const MONTH_NAMES_MAP: Record<string, number> = {
  // Indonesian
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, ags: 7, aug: 7,
  september: 8, sep: 8,
  oktober: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  desember: 11, des: 11, dec: 11,
  // English
  january: 0,
  february: 1,
  march: 2,
  june: 5,
  july: 6,
  august: 7,
  october: 9,
  december: 11,
};

/**
 * Ekstraksi tanggal dari teks dengan berbagai variasi format:
 * - 22 September 2026, 22 Sep 2026, September 22, 2026
 * - 2026-09-22 (ISO)
 * - 22/09/2026 atau 22-09-2026
 */
export function extractDateFromText(text: string): string | null {
  // 1. Pola ISO YYYY-MM-DD
  const isoMatch = text.match(/\b(202[4-9]|203[0-9])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])\b/);
  if (isoMatch) {
    return isoMatch[0];
  }

  // 2. Pola DD/MM/YYYY atau DD-MM-YYYY
  const slashMatch = text.match(/\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](202[4-9]|203[0-9])\b/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, "0");
    const m = slashMatch[2].padStart(2, "0");
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3a. Pola "DD Month YYYY" (contoh: "15 Oktober 2026" atau "24 September 2026")
  const dayMonthYearMatch = text.match(/\b(0?[1-9]|[12][0-9]|3[01])\s+([a-zA-Z]{3,10})\s+(202[4-9]|203[0-9])\b/i);
  if (dayMonthYearMatch) {
    const day = dayMonthYearMatch[1].padStart(2, "0");
    const monthStr = dayMonthYearMatch[2].toLowerCase();
    const year = dayMonthYearMatch[3];
    if (MONTH_NAMES_MAP[monthStr] !== undefined) {
      const monthNum = (MONTH_NAMES_MAP[monthStr] + 1).toString().padStart(2, "0");
      return `${year}-${monthNum}-${day}`;
    }
  }

  // 3b. Pola "Month DD, YYYY" (contoh: "September 28, 2026")
  const monthDayYearMatch = text.match(/\b([a-zA-Z]{3,10})\s+(0?[1-9]|[12][0-9]|3[01]),?\s+(202[4-9]|203[0-9])\b/i);
  if (monthDayYearMatch) {
    const monthStr = monthDayYearMatch[1].toLowerCase();
    const day = monthDayYearMatch[2].padStart(2, "0");
    const year = monthDayYearMatch[3];
    if (MONTH_NAMES_MAP[monthStr] !== undefined) {
      const monthNum = (MONTH_NAMES_MAP[monthStr] + 1).toString().padStart(2, "0");
      return `${year}-${monthNum}-${day}`;
    }
  }

  return null;
}

/**
 * Ekstraksi nominal angka dan mata uang dari teks.
 */
export function extractAmountAndCurrency(text: string): { amount: number; currency: Currency } | null {
  // 1. Pola SGD: S$ 15.00, SGD 15, 15 SGD (harus sebelum USD agar S$ tidak tertangkap $)
  const sgdMatch = text.match(/(?:s\$\s*([0-9]+(?:[.,][0-9]{1,2})?)|([0-9]+(?:[.,][0-9]{1,2})?)\s*sgd|sgd\s*([0-9]+(?:[.,][0-9]{1,2})?))/i);
  if (sgdMatch) {
    const rawNum = (sgdMatch[1] || sgdMatch[2] || sgdMatch[3]).replace(/,/g, ".");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) {
      return { amount: val, currency: "SGD" };
    }
  }

  // 2. Pola IDR / Rupiah: Rp 186.000, IDR 54,990, Rp186.000, IDR 186000
  const rpMatch = text.match(/(?:rp\.?|idr)\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?|[0-9]+)/i);
  if (rpMatch) {
    let raw = rpMatch[1];
    raw = raw.replace(/[.,]00$/, "");
    raw = raw.replace(/[.,]/g, "");
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0) {
      return { amount: val, currency: "IDR" };
    }
  }

  // 3. Pola EUR: €15.00, 15 EUR, EUR 15
  const eurMatch = text.match(/(?:€\s*([0-9]+(?:[.,][0-9]{1,2})?)|([0-9]+(?:[.,][0-9]{1,2})?)\s*eur|eur\s*([0-9]+(?:[.,][0-9]{1,2})?))/i);
  if (eurMatch) {
    const rawNum = (eurMatch[1] || eurMatch[2] || eurMatch[3]).replace(/,/g, ".");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) {
      return { amount: val, currency: "EUR" };
    }
  }

  // 4. Pola USD: $20.00, $ 20, 20.00 USD, USD 20 (tidak diawali huruf S)
  const usdMatch = text.match(/(?:(?<![a-zA-Z])\$\s*([0-9]+(?:[.,][0-9]{1,2})?)|([0-9]+(?:[.,][0-9]{1,2})?)\s*usd|usd\s*([0-9]+(?:[.,][0-9]{1,2})?))/i);
  if (usdMatch) {
    const rawNum = (usdMatch[1] || usdMatch[2] || usdMatch[3]).replace(/,/g, ".");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) {
      return { amount: val, currency: "USD" };
    }
  }

  return null;
}

/**
 * Ekstraksi siklus penagihan dari teks (bulanan, tahunan, kuartal, mingguan).
 */
export function extractIntervalFromText(text: string): Interval {
  const lower = text.toLowerCase();
  if (lower.includes("tahunan") || lower.includes("yearly") || lower.includes("annual") || lower.includes("per tahun") || lower.includes("/year") || lower.includes("/thn")) {
    return "yearly";
  }
  if (lower.includes("kuartal") || lower.includes("quarterly") || lower.includes("3 bulan") || lower.includes("per kuartal")) {
    return "quarterly";
  }
  if (lower.includes("mingguan") || lower.includes("weekly") || lower.includes("per minggu") || lower.includes("/week")) {
    return "weekly";
  }
  return "monthly"; // default ke bulanan
}

/**
 * Provider-specific parser untuk layanan digital populer.
 */
function tryParsePopularProvider(text: string, lower: string): ParsedInvoice | null {
  const defaultDate = toISO(new Date(Date.now() + 86400000 * 30));
  const detectedDate = extractDateFromText(text) || defaultDate;

  // 1. Netflix
  if (lower.includes("netflix")) {
    let name = "Netflix";
    if (lower.includes("standar") || lower.includes("standard")) name = "Netflix Standard";
    if (lower.includes("premium")) name = "Netflix Premium";
    if (lower.includes("dasar") || lower.includes("basic")) name = "Netflix Basic";

    const amtCur = extractAmountAndCurrency(text) || { amount: 186000, currency: "IDR" as Currency };
    return {
      name,
      amount: amtCur.amount,
      currency: amtCur.currency,
      interval: extractIntervalFromText(text),
      next_billing_date: detectedDate,
      suggested_category: "Streaming",
      confidence: 96,
      raw_snippet: `Netflix · ${amtCur.currency} ${amtCur.amount}`,
    };
  }

  // 2. Spotify
  if (lower.includes("spotify")) {
    let name = "Spotify";
    if (lower.includes("individual")) name = "Spotify Premium Individual";
    if (lower.includes("family")) name = "Spotify Premium Family";
    if (lower.includes("duo")) name = "Spotify Premium Duo";
    if (lower.includes("student")) name = "Spotify Student";

    const amtCur = extractAmountAndCurrency(text) || { amount: 54990, currency: "IDR" as Currency };
    return {
      name,
      amount: amtCur.amount,
      currency: amtCur.currency,
      interval: extractIntervalFromText(text),
      next_billing_date: detectedDate,
      suggested_category: "Streaming",
      confidence: 96,
      raw_snippet: `Spotify · ${amtCur.currency} ${amtCur.amount}`,
    };
  }

  // 3. OpenAI / ChatGPT Plus
  if (lower.includes("openai") || lower.includes("chatgpt")) {
    const amtCur = extractAmountAndCurrency(text) || { amount: 20, currency: "USD" as Currency };
    return {
      name: "ChatGPT Plus",
      amount: amtCur.amount,
      currency: amtCur.currency,
      interval: extractIntervalFromText(text),
      next_billing_date: detectedDate,
      suggested_category: "AI Tools",
      confidence: 95,
      raw_snippet: `OpenAI / ChatGPT Plus · ${amtCur.currency} ${amtCur.amount}`,
    };
  }

  // 4. Midjourney / Claude / Anthropic
  if (lower.includes("midjourney") || lower.includes("anthropic") || lower.includes("claude.ai")) {
    let name = "Midjourney";
    if (lower.includes("claude") || lower.includes("anthropic")) name = "Claude Pro";
    const amtCur = extractAmountAndCurrency(text) || { amount: 20, currency: "USD" as Currency };
    return {
      name,
      amount: amtCur.amount,
      currency: amtCur.currency,
      interval: extractIntervalFromText(text),
      next_billing_date: detectedDate,
      suggested_category: "AI Tools",
      confidence: 92,
      raw_snippet: `${name} · ${amtCur.currency} ${amtCur.amount}`,
    };
  }

  // 5. YouTube / Google
  if (lower.includes("youtube") || lower.includes("google play") || lower.includes("google one")) {
    let name = "YouTube Premium";
    if (lower.includes("google one")) name = "Google One";
    if (lower.includes("google play")) name = "Google Play";
    const amtCur = extractAmountAndCurrency(text) || { amount: 69000, currency: "IDR" as Currency };
    return {
      name,
      amount: amtCur.amount,
      currency: amtCur.currency,
      interval: extractIntervalFromText(text),
      next_billing_date: detectedDate,
      suggested_category: name.includes("One") ? "Utilitas" : "Streaming",
      confidence: 92,
      raw_snippet: `${name} · ${amtCur.currency} ${amtCur.amount}`,
    };
  }

  // 6. Apple / iCloud
  if (lower.includes("apple") || lower.includes("icloud")) {
    let name = "Apple Services";
    if (lower.includes("icloud")) name = "iCloud+";
    if (lower.includes("apple music")) name = "Apple Music";
    if (lower.includes("apple one")) name = "Apple One";

    const amtCur = extractAmountAndCurrency(text) || { amount: 15000, currency: "IDR" as Currency };
    return {
      name,
      amount: amtCur.amount,
      currency: amtCur.currency,
      interval: extractIntervalFromText(text),
      next_billing_date: detectedDate,
      suggested_category: name.includes("Music") ? "Streaming" : "Utilitas",
      confidence: 92,
      raw_snippet: `${name} · ${amtCur.currency} ${amtCur.amount}`,
    };
  }

  // 7. IndiHome / Telkom / MyRepublic / Biznet
  if (lower.includes("indihome") || lower.includes("telkom") || lower.includes("biznet") || lower.includes("myrepublic") || lower.includes("first media")) {
    let name = "Internet (IndiHome)";
    if (lower.includes("biznet")) name = "Internet (Biznet)";
    if (lower.includes("myrepublic")) name = "Internet (MyRepublic)";
    if (lower.includes("first media")) name = "Internet (First Media)";

    const amtCur = extractAmountAndCurrency(text) || { amount: 350000, currency: "IDR" as Currency };
    return {
      name,
      amount: amtCur.amount,
      currency: amtCur.currency,
      interval: "monthly",
      next_billing_date: detectedDate,
      suggested_category: "Utilitas",
      confidence: 94,
      raw_snippet: `${name} · ${amtCur.currency} ${amtCur.amount}`,
    };
  }

  return null;
}

/**
 * Heuristic fallback parser untuk teks invoice/tagihan yang tidak berasal dari provider populer.
 */
function parseHeuristicFallback(text: string): ParsedInvoice | null {
  const amtCur = extractAmountAndCurrency(text);
  if (!amtCur) return null;

  const detectedDate = extractDateFromText(text) || toISO(new Date(Date.now() + 86400000 * 30));
  const interval = extractIntervalFromText(text);

  // Cari kemungkinan nama layanan dari baris pertama atau subject
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.toLowerCase().startsWith("from:") && !l.toLowerCase().startsWith("to:"));

  let guessedName = "Tagihan Baru";
  for (const line of lines) {
    if (line.toLowerCase().includes("subject:") || line.toLowerCase().includes("tagihan:") || line.toLowerCase().includes("invoice:")) {
      const cleaned = line.replace(/^(subject|tagihan|invoice|perihal)\s*:\s*/i, "").trim();
      if (cleaned.length > 2) {
        guessedName = cleaned.slice(0, 40);
        break;
      }
    }
  }

  if (guessedName === "Tagihan Baru" && lines.length > 0) {
    guessedName = lines[0].slice(0, 35);
  }

  return {
    name: guessedName,
    amount: amtCur.amount,
    currency: amtCur.currency,
    interval,
    next_billing_date: detectedDate,
    confidence: 70,
    raw_snippet: `${guessedName} · ${amtCur.currency} ${amtCur.amount}`,
  };
}

/**
 * Deep Seam: parseInvoiceText
 * Mengekstrak informasi langganan secara terstruktur dari teks email / file invoice.
 */
export function parseInvoiceText(rawText: string): ParsedInvoice | null {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return null;
  }

  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // 1. Coba deteksi provider populer (Netflix, Spotify, ChatGPT, Apple, Google, IndiHome, dsb.)
  const providerResult = tryParsePopularProvider(trimmed, lower);
  if (providerResult) {
    return providerResult;
  }

  // 2. Coba fallback heuristik (ekstrak nominal, mata uang, dan tanggal umum)
  return parseHeuristicFallback(trimmed);
}
