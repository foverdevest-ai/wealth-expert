export const formatCurrency = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits,
  }).format(value);

export const formatPercent = (value: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(value);
