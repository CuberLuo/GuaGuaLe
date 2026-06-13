export interface HistoryItem {
  money: string;
  time: string;
}

export interface ValidateResult {
  valid: boolean;
  userId?: number;
  remainingCount?: number;
  history?: HistoryItem[];
}

export async function validateName(name: string): Promise<ValidateResult> {
  const res = await fetch(`/api/validate-name?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Network response failed');
  return res.json();
}
