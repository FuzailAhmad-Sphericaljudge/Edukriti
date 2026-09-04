import { apiErrorSchema } from '@edukriti/contracts';

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return Response.json(apiErrorSchema.parse({ error: { code, message, details } }), { status });
}
