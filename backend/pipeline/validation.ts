import type { FullSchema } from "./schema";

export interface ValidationError {
  type: "DB_ERROR" | "API_ERROR" | "UI_ERROR" | "AUTH_ERROR" | "CROSS_LAYER_ERROR" | "UI_API_MISMATCH" | "API_DB_MISMATCH";
  message: string;
  location: string;
}

export function validateDB(db: FullSchema["db"]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!db || !Array.isArray(db.tables) || db.tables.length === 0) {
    errors.push({ type: "DB_ERROR", message: "DB Schema lacks the 'tables' array or it is empty.", location: "db.tables" });
    return errors;
  }
  
  const knownTables = new Set<string>();
  for (let i = 0; i < db.tables.length; i++) {
    const table = db.tables[i];
    const loc = `db.tables[${i}]`;
    
    if (!table.name) {
      errors.push({ type: "DB_ERROR", message: "A DB table is missing the 'name' property.", location: loc });
      continue;
    }
    
    if (knownTables.has(table.name)) {
      errors.push({ type: "DB_ERROR", message: `DB Table '${table.name}' is defined more than once.`, location: `${loc}.name` });
    }
    knownTables.add(table.name);

    if (!Array.isArray(table.fields) || table.fields.length === 0) {
      errors.push({ type: "DB_ERROR", message: `DB Table '${table.name}' has no fields defined.`, location: `${loc}.fields` });
    } else {
      const knownFields = new Set<string>();
      for (let j = 0; j < table.fields.length; j++) {
        const field = table.fields[j];
        const fieldLoc = `${loc}.fields[${j}]`;
        
        if (!field.name) {
          errors.push({ type: "DB_ERROR", message: `DB Table '${table.name}' has a field missing the 'name' property.`, location: fieldLoc });
        } else if (knownFields.has(field.name)) {
          errors.push({ type: "DB_ERROR", message: `DB Table '${table.name}' has duplicate field '${field.name}'.`, location: `${fieldLoc}.name` });
        }
        
        if (field.name && !field.type) {
          errors.push({ type: "DB_ERROR", message: `DB Table '${table.name}' field '${field.name}' is missing a 'type'.`, location: fieldLoc });
        }
        if (field.name) knownFields.add(field.name);
      }
    }
  }
  return errors;
}

const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export function validateAPI(api: FullSchema["api"]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!api || !Array.isArray(api.endpoints) || api.endpoints.length === 0) {
    errors.push({ type: "API_ERROR", message: "API Schema lacks the 'endpoints' array or it is empty.", location: "api.endpoints" });
    return errors;
  }
  
  const knownEndpoints = new Set<string>();
  for (let i = 0; i < api.endpoints.length; i++) {
    const endpoint = api.endpoints[i];
    const loc = `api.endpoints[${i}]`;
    
    if (!endpoint.path) {
      errors.push({ type: "API_ERROR", message: "An API Endpoint is missing the 'path' property.", location: loc });
    } else if (!endpoint.path.startsWith("/")) {
      errors.push({ type: "API_ERROR", message: `API Endpoint path '${endpoint.path}' must start with '/'.`, location: `${loc}.path` });
    }
    
    if (!endpoint.method) {
      errors.push({ type: "API_ERROR", message: `API Endpoint '${endpoint.path || 'unknown'}' is missing the 'method' property.`, location: loc });
    } else if (!VALID_METHODS.has(endpoint.method.toUpperCase())) {
      errors.push({ type: "API_ERROR", message: `API Endpoint '${endpoint.path}' has invalid HTTP method '${endpoint.method}'.`, location: `${loc}.method` });
    }
    
    if (endpoint.path && endpoint.method) {
      const key = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
      if (knownEndpoints.has(key)) {
        errors.push({ type: "API_ERROR", message: `API Endpoint '${key}' is explicitly duplicated.`, location: loc });
      }
      knownEndpoints.add(key);
    }
    
    if (!endpoint.request) errors.push({ type: "API_ERROR", message: `API Endpoint '${endpoint.method} ${endpoint.path}' is missing 'request' specification payload.`, location: `${loc}.request` });
    if (!endpoint.response) errors.push({ type: "API_ERROR", message: `API Endpoint '${endpoint.method} ${endpoint.path}' is missing 'response' specification payload.`, location: `${loc}.response` });
  }
  return errors;
}

export function validateUI(ui: FullSchema["ui"]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!ui || !Array.isArray(ui.pages)) errors.push({ type: "UI_ERROR", message: "UI Schema lacks the 'pages' array.", location: "ui.pages" });
  if (!ui || !Array.isArray(ui.components) || ui.components.length === 0) {
    errors.push({ type: "UI_ERROR", message: "UI Schema lacks the 'components' array or it is empty.", location: "ui.components" });
    return errors;
  }
  
  const knownPages = new Set<string>();
  if (Array.isArray(ui.pages)) {
    for (let i = 0; i < ui.pages.length; i++) {
       const page = ui.pages[i];
      if (!page) errors.push({ type: "UI_ERROR", message: "UI Schema contains an empty page name string.", location: `ui.pages[${i}]` });
      if (knownPages.has(page)) errors.push({ type: "UI_ERROR", message: `UI duplicated page definition: '${page}'.`, location: `ui.pages[${i}]` });
      knownPages.add(page);
    }
  }

  const knownComps = new Set<string>();
  if (Array.isArray(ui.components)) {
    for (let i = 0; i < ui.components.length; i++) {
      const comp = ui.components[i];
      const loc = `ui.components[${i}]`;
      if (!comp.name) {
        errors.push({ type: "UI_ERROR", message: "A UI Component is missing the 'name' property.", location: loc });
        continue;
      }
      if (knownComps.has(comp.name)) {
        errors.push({ type: "UI_ERROR", message: `UI Component '${comp.name}' is defined more than once.`, location: `${loc}.name` });
      }
      knownComps.add(comp.name);

      if (!Array.isArray(comp.endpoints)) {
        errors.push({ type: "UI_ERROR", message: `UI Component '${comp.name}' lacks the 'endpoints' array property.`, location: `${loc}.endpoints` });
      }
    }
  }
  return errors;
}

export function validateAuth(auth: FullSchema["auth"]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!auth || !auth.roles || typeof auth.roles !== "object") {
    errors.push({ type: "AUTH_ERROR", message: "Auth Schema lacks the 'roles' mapping object.", location: "auth.roles" });
    return errors;
  }
  return errors;
}

export function crossValidate(schema: FullSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!schema) return errors;

  const dbTableNames = new Set(schema.db?.tables?.map(t => t.name.toLowerCase()) || []);
  const apiEndpointKeys = new Set(schema.api?.endpoints?.map(e => `${e.method.toUpperCase()} ${e.path.toLowerCase()}`) || []);

  // 1. UI -> API Cross-layer Check
  if (schema.ui && Array.isArray(schema.ui.components)) {
    schema.ui.components.forEach((comp, i) => {
      if (Array.isArray(comp.endpoints)) {
        comp.endpoints.forEach((ep, j) => {
          const parts = ep.split(" ");
          const normalizedEp = parts.length >= 2 ? `${parts[0].toUpperCase()} ${parts[1].toLowerCase()}` : ep;
          if (!apiEndpointKeys.has(normalizedEp)) {
            errors.push({ type: "UI_API_MISMATCH", message: `UI Component '${comp.name}' refers to non-existent API endpoint '${ep}'.`, location: `ui.components[${i}].endpoints[${j}]` });
          }
        });
      }
    });
  }

  // 2. API -> DB Cross-layer Check
  if (schema.api && Array.isArray(schema.api.endpoints)) {
    schema.api.endpoints.forEach((ep, i) => {
      if (ep.path && ep.path.startsWith("/")) {
        const resourceMatch = ep.path.split("/")[1];
        if (resourceMatch && resourceMatch.toLowerCase() !== "auth") {
          const possibleTableName = resourceMatch.toLowerCase();
          const singularTableName = possibleTableName.endsWith('s') ? possibleTableName.slice(0, -1) : possibleTableName;
          
          if (!dbTableNames.has(possibleTableName) && !dbTableNames.has(singularTableName)) {
            errors.push({ type: "API_DB_MISMATCH", message: `API Endpoint '${ep.method} ${ep.path}' handles resource '${resourceMatch}', but no corresponding DB table exists.`, location: `api.endpoints[${i}].path` });
          }
        }
      }
    });
  }

  // 3. Auth -> API Cross-layer Check
  if (schema.auth && schema.auth.roles) {
    const roles = Object.keys(schema.auth.roles);
    if (roles.length > 0 && !Array.from(apiEndpointKeys).some(k => k.includes("/auth"))) {
      errors.push({ type: "CROSS_LAYER_ERROR", message: "Auth roles are defined, but API Schema is missing corresponding '/auth' endpoints.", location: "api.endpoints" });
    }
  }

  // 4. Auth -> DB Cross-layer Check
  if (schema.auth && schema.auth.roles) {
    Object.entries(schema.auth.roles).forEach(([role, permissions]) => {
      if (Array.isArray(permissions)) {
        permissions.forEach((perm, i) => {
          if (perm.includes(":")) {
            const [, resource] = perm.split(":");
            if (resource !== "*" && resource !== "limited" && resource !== "own") {
              const possibleTable = resource.toLowerCase();
              if (!dbTableNames.has(possibleTable)) {
                errors.push({ type: "CROSS_LAYER_ERROR", message: `Auth role '${role}' has explicit permission for resource '${resource}', but no such DB table exists.`, location: `auth.roles['${role}'][${i}]` });
              }
            }
          }
        });
      }
    });
  }

  return errors;
}
