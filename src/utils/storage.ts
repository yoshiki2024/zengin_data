import { HeaderRecord } from '../types/zengin';

const STORAGE_KEY_HEADER = 'zengin_flow_client_header_v1';

export const DEFAULT_HEADER: HeaderRecord = {
  typeCode: '21',
  codeClassification: '0',
  clientCode: '',
  clientName: '',
  transferDate: getTodayMMDD(),
  bankCode: '',
  bankName: '',
  branchCode: '',
  branchName: '',
  accountType: '1',
  accountNumber: '',
};

function getTodayMMDD(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${m}${d}`;
}

export function loadSavedHeader(): HeaderRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HEADER);
    if (!raw) return { ...DEFAULT_HEADER, transferDate: getTodayMMDD() };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_HEADER,
      ...parsed,
      transferDate: parsed.transferDate || getTodayMMDD(),
    };
  } catch (e) {
    console.error('Failed to load saved header', e);
    return { ...DEFAULT_HEADER, transferDate: getTodayMMDD() };
  }
}

export function saveHeader(header: HeaderRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY_HEADER, JSON.stringify(header));
  } catch (e) {
    console.error('Failed to save header to localStorage', e);
  }
}

export function clearSavedHeader(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HEADER);
  } catch (e) {
    console.error('Failed to clear saved header', e);
  }
}
