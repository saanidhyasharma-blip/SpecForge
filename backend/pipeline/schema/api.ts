import type { Design } from "../design";
import { DEFAULT_ENTITY_FIELDS } from "./db";

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
  return `/${entity.toLowerCase()}s`;
}

function fieldsToObject(fields: typeof DEFAULT_ENTITY_FIELDS) {
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
  const entityFields = fieldsToObject(DEFAULT_ENTITY_FIELDS);

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
    design.entities.includes("User") ||
    design.flows.some((flow) => flow.toLowerCase().includes("signs in"))
  );
}

function createAuthEndpoints(): APIEndpoint[] {
  return [
    {
      path: "/auth/login",
      method: "POST",
      request: { body: { email: "string", password: "string" } },
      response: { token: "string", user: fieldsToObject(DEFAULT_ENTITY_FIELDS) }
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
      response: { user: fieldsToObject(DEFAULT_ENTITY_FIELDS) }
    }
  ];
}

export function generateAPISchema(design: Design): APISchema {
  // Generate full CRUD endpoints for each entity
  const endpoints = design.entities.flatMap(createCrudEndpoints);

  // Include auth endpoints if necessary
  if (needsAuthEndpoints(design) || design.entities.some(e => e.toLowerCase() === "admin" || e.toLowerCase() === "user")) {
    endpoints.unshift(...createAuthEndpoints());
  }

  return {
    endpoints
  };
}

export const generateApiSchema = generateAPISchema;
