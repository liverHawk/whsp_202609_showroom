import { rankingBody } from './_final';

export function GET() {
  return Response.json(rankingBody());
}
