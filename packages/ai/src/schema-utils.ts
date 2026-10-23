import { z } from 'zod';

export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  return cleanJsonSchema(jsonSchema);
}

export function cleanJsonSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...schema };
  delete cleaned.$schema;
  delete cleaned.default;

  if (cleaned.properties && typeof cleaned.properties === 'object') {
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(cleaned.properties as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        props[k] = cleanJsonSchema(v as Record<string, unknown>);
      } else {
        props[k] = v;
      }
    }
    cleaned.properties = props;
  }

  if (cleaned.items && typeof cleaned.items === 'object') {
    cleaned.items = cleanJsonSchema(cleaned.items as Record<string, unknown>);
  }

  return cleaned;
}
