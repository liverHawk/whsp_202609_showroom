import { historyBody } from './_final';

export function GET() {
  return Response.json(historyBody());
}
