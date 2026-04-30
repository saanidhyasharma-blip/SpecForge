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

// Common fields for specific entities to make schemas more usable
const COMMON_FIELDS: Record<string, DBField[]> = {
  user: [
    { name: "id", type: "string" },
    { name: "email", type: "string" },
    { name: "password", type: "string" },
    { name: "name", type: "string" }
  ],
  weather: [
    { name: "id", type: "string" },
    { name: "city", type: "string" },
    { name: "temperature", type: "number" },
    { name: "condition", type: "string" }
  ],
  contact: [
    { name: "id", type: "string" },
    { name: "name", type: "string" },
    { name: "email", type: "string" },
    { name: "phone", type: "string" }
  ],
  payment: [
    { name: "id", type: "string" },
    { name: "amount", type: "number" },
    { name: "currency", type: "string" },
    { name: "status", type: "string" }
  ],
  product: [
    { name: "id", type: "string" },
    { name: "name", type: "string" },
    { name: "price", type: "number" },
    { name: "stock", type: "number" }
  ],
  order: [
    { name: "id", type: "string" },
    { name: "status", type: "string" },
    { name: "total", type: "number" },
    { name: "createdAt", type: "string" }
  ],
  task: [
    { name: "id", type: "string" },
    { name: "title", type: "string" },
    { name: "status", type: "string" },
    { name: "dueDate", type: "string" }
  ],
  project: [
    { name: "id", type: "string" },
    { name: "name", type: "string" },
    { name: "status", type: "string" }
  ],
  booking: [
    { name: "id", type: "string" },
    { name: "date", type: "string" },
    { name: "status", type: "string" },
    { name: "customerName", type: "string" }
  ],
  post: [
    { name: "id", type: "string" },
    { name: "title", type: "string" },
    { name: "content", type: "string" },
    { name: "createdAt", type: "string" }
  ],
  comment: [
    { name: "id", type: "string" },
    { name: "content", type: "string" },
    { name: "createdAt", type: "string" }
  ],
  employee: [
    { name: "id", type: "string" },
    { name: "name", type: "string" },
    { name: "department", type: "string" },
    { name: "status", type: "string" }
  ],
  leaverequest: [
    { name: "id", type: "string" },
    { name: "startDate", type: "string" },
    { name: "endDate", type: "string" },
    { name: "status", type: "string" }
  ],
  recipe: [
    { name: "id", type: "string" },
    { name: "title", type: "string" },
    { name: "ingredients", type: "string" },
    { name: "instructions", type: "string" }
  ],
  transaction: [
    { name: "id", type: "string" },
    { name: "amount", type: "number" },
    { name: "category", type: "string" },
    { name: "date", type: "string" }
  ],
  budget: [
    { name: "id", type: "string" },
    { name: "name", type: "string" },
    { name: "limit", type: "number" }
  ],
  message: [
    { name: "id", type: "string" },
    { name: "content", type: "string" },
    { name: "sentAt", type: "string" }
  ]
};

export const DEFAULT_ENTITY_FIELDS: DBField[] = [
  { name: "id", type: "string" },
  { name: "createdAt", type: "string" },
  { name: "name", type: "string" }
];

export function getFieldsForEntity(entity: string): DBField[] {
  const normalized = entity.toLowerCase();
  return COMMON_FIELDS[normalized] || [...DEFAULT_ENTITY_FIELDS];
}

function createTable(entity: string): DBTable {
  const fields = getFieldsForEntity(entity);
  
  return {
    name: toTableName(entity),
    fields: [...fields]
  };
}

export function generateDBSchema(design: Design): DBSchema {
  const entities = [...design.entities];
  
  // Rule: NEVER return empty arrays. If no entities, default to User.
  if (entities.length === 0) {
    entities.push("User");
  }

  return {
    tables: entities.map(createTable)
  };
}

export const generateDbSchema = generateDBSchema;
