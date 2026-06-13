export interface PrizeResult {
  originalMoney: string;
  luckyMoney: string;
}

export async function fetchPrize(userId: number): Promise<PrizeResult> {
  const res = await fetch(`/api/prize?userId=${userId}`);
  if (!res.ok) throw new Error('Network response failed');
  return res.json();
}
