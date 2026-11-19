import {
  formatINR,
  formatLakhsCrores,
  formatDateIST,
  formatDateTimeIST,
  getCGPABadge
} from '@cas-erp/shared';

export function todayIST() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export { formatINR, formatLakhsCrores, formatDateIST, formatDateTimeIST, getCGPABadge };
