import type { Design } from "../design";

export interface DBField {
  name: string;
  type: string;
}

export interface DBTable {
  name: string;
  fields: DBField[];
}

export interface DBSchema {
  tables: DBTable[];
}

function toTableName(entity: string): string {
  return entity.toLowerCase();
}

export const DEFAULT_ENTITY_FIELDS: DBField[] = [
  { name: "id", type: "string" },
  { name: "createdAt", type: "string" },
  { name: "name", type: "string" }
];

function createTable(entity: string): DBTable {
  return {
    name: toTableName(entity),
    fields: [...DEFAULT_ENTITY_FIELDS]
  };
}

export function generateDBSchema(design: Design): DBSchema {
  // Generate tables for all entities, as they might need to be referenced
  return {
    tables: design.entities.map(createTable)
  };
}

export const generateDbSchema = generateDBSchema;
