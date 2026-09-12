import { baseRecordSchema } from './base.schema';
import { z } from 'zod';

export const exampleRecordSchema = baseRecordSchema.extend({
  name: z.string().min(1).max(255),
  active: z.boolean(),
});

export type ExampleRecord = z.infer<typeof exampleRecordSchema>;
