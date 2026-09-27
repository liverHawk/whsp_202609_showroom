import { healthBody } from './_final';

export function GET() {
  return Response.json(healthBody());
}
