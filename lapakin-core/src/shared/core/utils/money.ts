export function toCents(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  const [whole = '0', frac = ''] = value.split('.');
  return Number(whole) * 100 + Number(`${frac}00`.slice(0, 2));
}

export function centsToDecimal(cents: number): string {
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, '0');
  return `${whole}.${frac}`;
}

export const toNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return toCents(value) / 100;
};

export const numberToDecimal = (value: number): string => centsToDecimal(Math.round(value * 100));
