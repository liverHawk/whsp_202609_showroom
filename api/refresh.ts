import { rankingBody } from './_final';

// 結果は確定済みのため、refresh も確定データを返すだけ
export function POST() {
  return Response.json(rankingBody());
}
