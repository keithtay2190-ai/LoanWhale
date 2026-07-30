export function formatSGD(amount: number) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(rate: number) {
  return `${rate.toFixed(2)}% p.a.`;
}
