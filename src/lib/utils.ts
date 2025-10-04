import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, short: boolean = false) {
    if (short) {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}م`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}أ`;
    }
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
