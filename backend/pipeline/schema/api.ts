import type { Design } from "../design";
import { getFieldsForEntity } from "./db";

export interface APIEndpoint {
  path: string;
  method: string;
  request: object;
  response: object;
}

export interface APISchema {
  endpoints: APIEndpoint[];
}

function toResourcePath(entity: string): string {
  const normalized = entity.toLowerCase();
  const uncountable = new Set(["weather"]);

  if (uncountable.has(normalized) || normalized.endsWith("s")) {
    return `/${normalized}`;
  }

  return `/${normalized}s`;
}

function fieldsToObject(fields: any[]) {
  const obj: Record<string, string> = {};
  for (const field of fields) {
    obj[field.name] = field.type;
  }
  return obj;
}

function createCrudEndpoints(entity: string): APIEndpoint[] {
  const resourcePath = toResourcePath(entity);
  const itemPath = `${resourcePath}/:id`;

  // API fields must match DB fields
  const fields = getFieldsForEntity(entity);
  const entityFields = fieldsToObject(fields);

  return [
    {
      path: resourcePath,
      method: "GET",
      request: {},
      response: { items: [entityFields] }
    },
    {
      path: resourcePath,
      method: "POST",
      request: { body: entityFields },
      response: { item: entityFields }
    },
    {
      path: itemPath,
      method: "GET",
      request: { params: { id: "string" } },
      response: { item: entityFields }
    },
    {
      path: itemPath,
      method: "PUT",
      request: { params: { id: "string" }, body: entityFields },
      response: { item: entityFields }
    },
    {
      path: itemPath,
      method: "DELETE",
      request: { params: { id: "string" } },
      response: { success: true }
    }
  ];
}

function needsAuthEndpoints(design: Design): boolean {
  return (
    design.entities.some(e => ["user", "admin", "role", "account"].includes(e.toLowerCase())) ||
    design.flows.some((flow) => {
      const f = flow.toLowerCase();
      return f.includes("signs in") || f.includes("login") || f.includes("auth");
    })
  );
}

function createAuthEndpoints(): APIEndpoint[] {
  const userFields = fieldsToObject(getFieldsForEntity("User"));
  return [
    {
      path: "/auth/login",
      method: "POST",
      request: { body: { email: "string", password: "string" } },
      response: { token: "string", user: userFields }
    },
    {
      path: "/auth/logout",
      method: "POST",
      request: {},
      response: { success: true }
    },
    {
      path: "/auth/me",
      method: "GET",
      request: {},
      response: { user: userFields }
    }
  ];
}

export function generateAPISchema(design: Design): APISchema {
  const entities = design.entities.length > 0 ? design.entities : ["User"];
  const flows = design.flows.map(f => f.toLowerCase());

  // Generate full CRUD endpoints for each entity
  const endpoints = entities.flatMap(createCrudEndpoints);

  // Include auth endpoints if necessary (using same logic as UI)
  const hasAuth = entities.some(e => ["user", "admin", "role", "account"].includes(e.toLowerCase())) ||
    flows.some(f => f.includes("signs in") || f.includes("login") || f.includes("auth"));

  if (hasAuth) {
    endpoints.unshift(...createAuthEndpoints());
  }

  return {
    endpoints
  };
}

export const generateApiSchema = generateAPISchema;
