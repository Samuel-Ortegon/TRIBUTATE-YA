import { exampleRecordSchema } from './example.schema';

export const schemaRegistry: Record<string, typeof exampleRecordSchema> = {
  example: exampleRecordSchema,
};

export function getSchema(collection: string): typeof exampleRecordSchema | null {
  return schemaRegistry[collection] ?? null;
}
