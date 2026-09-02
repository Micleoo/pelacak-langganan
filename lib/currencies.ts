export type Currency = "IDR" | "USD" | "EUR" | "SGD";

export const SUPPORTED_CURRENCIES: Currency[] = ["IDR", "USD", "EUR", "SGD"];

export const CURRENCY_LABELS: Record<Currency, string> = {
  IDR: "Rupiah Indonesia (IDR)",
  USD: "Dolar AS (USD)",
  EUR: "Euro (EUR)",
  SGD: "Dolar Singapura (SGD)",
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  IDR: "Rp",
  USD: "$",
  EUR: "€",
  SGD: "S$",
};

export const EXCHANGE_RATES_TO_IDR: Record<Currency, number> = {
  IDR: 1,
  USD: 15500,
  EUR: 16800,
  SGD: 11500,
};

export function isValidCurrency(c: unknown): c is Currency {
  return typeof c === "string" && SUPPORTED_CURRENCIES.includes(c as Currency);
}

export function convertToBaseCurrency(
  amount: number,
  fromCurrency: Currency | string,
  baseCurrency: Currency | string = "IDR"
): number {
  const from: Currency = isValidCurrency(fromCurrency) ? fromCurrency : "IDR";
  const base: Currency = isValidCurrency(baseCurrency) ? baseCurrency : "IDR";

  if (from === base) return amount;

  const fromRate = EXCHANGE_RATES_TO_IDR[from] ?? 1;
  const toRate = EXCHANGE_RATES_TO_IDR[base] ?? 1;

  if (toRate <= 0) return amount;

  return (amount * fromRate) / toRate;
}

export function formatCurrency(amount: number, currency: Currency | string): string {
  const safeCurrency: Currency = isValidCurrency(currency) ? currency : "IDR";
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: safeCurrency === "IDR" ? 0 : 2,
  });
  return formatter.format(amount);
}

export function formatCurrencyMonthly(amount: number, currency: Currency | string): string {
  return `${formatCurrency(amount, currency)}/bln`;
}

export function getCurrencySymbol(currency: Currency | string): string {
  const safeCurrency: Currency = isValidCurrency(currency) ? currency : "IDR";
  return CURRENCY_SYMBOLS[safeCurrency];
}