import type { Design } from "./design";
import { generateUISchema, type UISchema } from "./schema/ui";
import { generateAPISchema, type APISchema } from "./schema/api";
import { generateDBSchema, type DBSchema } from "./schema/db";
import { generateAuthSchema, type AuthSchema } from "./schema/auth";

export interface FullSchema {
  ui: UISchema;
  api: APISchema;
  db: DBSchema;
  auth: AuthSchema;
}

export function generateSchema(design: Design): FullSchema {
  return {
    ui: generateUISchema(design),
    api: generateAPISchema(design),
    db: generateDBSchema(design),
    auth: generateAuthSchema(design)
  };
}

// Exporting types for convenience
export type { UISchema, APISchema, DBSchema, AuthSchema };
