import type { FullSchema } from "./schema";
import type { ValidationError } from "./validation";

export function repairDB(schema: FullSchema, error: ValidationError): void {
  if (!schema.db) schema.db = { tables: [] };
  if (!Array.isArray(schema.db.tables)) schema.db.tables = [];

  // If DB has no tables -> Create default "User" table
  if (schema.db.tables.length === 0) {
    schema.db.tables.push({
      name: "User",
      fields: [
        { name: "id", type: "string" },
        { name: "email", type: "string" }
      ]
    });
    console.log(`Fixed DB_ERROR: added default 'User' table since DB had no tables`);
    return;
  }

  // If a table has no fields -> Add ["id", "created_at"]
  for (const table of schema.db.tables) {
    if (!Array.isArray(table.fields) || table.fields.length === 0) {
      table.fields = [
        { name: "id", type: "string" },
        { name: "created_at", type: "string" }
      ];
      console.log(`Fixed DB_ERROR: added default fields to ${table.name} table`);
    }
  }
}

export function repairAPI(schema: FullSchema, error: ValidationError): void {
  if (!schema.api) schema.api = { endpoints: [] };
  if (!schema.api.endpoints) schema.api.endpoints = [];
  if (!schema.db) schema.db = { tables: [] };
  if (!schema.db.tables) schema.db.tables = [];

  const dbTableNames = new Set(schema.db.tables.map(t => t.name.toLowerCase()));
  const apiPaths = new Set(schema.api.endpoints.map(e => e.path.toLowerCase()));

  // 1. If API endpoint refers to an entity not in DB -> Add missing table in DB
  schema.api.endpoints.forEach(ep => {
    if (ep.path && ep.path.startsWith("/")) {
      const resourceMatch = ep.path.split("/")[1];
      if (resourceMatch && resourceMatch.toLowerCase() !== "auth") {
        const possibleTableName = resourceMatch.toLowerCase();
        const singularTableName = possibleTableName.endsWith('s') ? possibleTableName.slice(0, -1) : possibleTableName;
        
        if (!dbTableNames.has(possibleTableName) && !dbTableNames.has(singularTableName)) {
          console.log(`Fixed API_DB_MISMATCH: added missing DB table '${singularTableName}' for API endpoint`);
          schema.db.tables.push({
            name: singularTableName,
            fields: [
              { name: "id", type: "string" },
              { name: "created_at", type: "string" }
            ]
          });
          dbTableNames.add(singularTableName);
        }
      }
    }
  });

  // 2. If DB exists but API missing endpoint -> Add CRUD endpoints for that table
  schema.db.tables.forEach(table => {
    if (!table.name) return;
    const tableName = table.name.toLowerCase();
    const pluralName = tableName === "weather" || tableName.endsWith('s') ? tableName : tableName + 's';
    
    // Check if any endpoint path starts with this resource
    const hasEndpoint = Array.from(apiPaths).some(p => p.includes(`/${tableName}`) || p.includes(`/${pluralName}`));
    
    if (!hasEndpoint) {
      console.log(`Fixed API_DB_MISMATCH: added CRUD endpoints for DB table ${table.name}`);
      const prefix = `/${pluralName}`;
      schema.api.endpoints.push({ method: "GET", path: prefix, request: {}, response: {} });
      schema.api.endpoints.push({ method: "POST", path: prefix, request: {}, response: {} });
      schema.api.endpoints.push({ method: "GET", path: `${prefix}/:id`, request: {}, response: {} });
      schema.api.endpoints.push({ method: "PUT", path: `${prefix}/:id`, request: {}, response: {} });
      schema.api.endpoints.push({ method: "DELETE", path: `${prefix}/:id`, request: {}, response: {} });
      
      apiPaths.add(prefix); // mark added
    }
  });
}

export function repairUI(schema: FullSchema, error: ValidationError): void {
  if (!schema.ui) schema.ui = { pages: [], components: [] };
  if (!Array.isArray(schema.ui.pages)) schema.ui.pages = [];
  if (!Array.isArray(schema.ui.components)) schema.ui.components = [];
  if (!schema.api) schema.api = { endpoints: [] };
  if (!schema.api.endpoints) schema.api.endpoints = [];

  const apiEndpointKeys = new Set(schema.api.endpoints.map(e => `${e.method.toUpperCase()} ${e.path.toLowerCase()}`));
  const addPage = (page: string) => {
    if (!schema.ui.pages.includes(page)) schema.ui.pages.push(page);
  };
  const addComponent = (name: string, endpoints: string[]) => {
    const existing = schema.ui.components.find(comp => comp.name === name);
    if (existing) {
      if (!Array.isArray(existing.endpoints)) existing.endpoints = [];
      endpoints.forEach(endpoint => {
        if (!existing.endpoints.includes(endpoint)) existing.endpoints.push(endpoint);
      });
      return;
    }

    schema.ui.components.push({ name, endpoints: [...endpoints] });
  };
  const toPageName = (resource: string) => {
    const singular = resource.endsWith("s") ? resource.slice(0, -1) : resource;
    return `${singular.charAt(0).toUpperCase()}${singular.slice(1)}Page`;
  };
  const resourcePaths = new Set<string>();

  addPage("HomePage");

  schema.api.endpoints.forEach((endpoint) => {
    if (!endpoint.path || endpoint.path.startsWith("/auth")) return;
    const resourcePath = `/${endpoint.path.split("/")[1]}`;
    resourcePaths.add(resourcePath);
  });

  if (resourcePaths.size === 0 && schema.db && Array.isArray(schema.db.tables)) {
    schema.db.tables.forEach((table) => {
      if (!table.name) return;
      const tableName = table.name.toLowerCase();
      const path = tableName === "weather" || tableName.endsWith("s") ? `/${tableName}` : `/${tableName}s`;
      resourcePaths.add(path);
    });
  }

  resourcePaths.forEach((resourcePath) => {
    const resource = resourcePath.slice(1);
    const pageName = toPageName(resource);
    addPage(pageName);
    addComponent(`${pageName.replace("Page", "")}Form`, [`POST ${resourcePath}`]);
    addComponent(`${pageName.replace("Page", "")}Table`, [
      `GET ${resourcePath}`,
      `PUT ${resourcePath}/:id`,
      `DELETE ${resourcePath}/:id`
    ]);
  });

  const hasAuthEndpoints = schema.api.endpoints.some(endpoint => endpoint.path?.startsWith("/auth"));
  if (hasAuthEndpoints) {
    addPage("LoginPage");
    addComponent("LoginForm", ["POST /auth/login"]);
    addComponent("Navbar", ["POST /auth/logout", "GET /auth/me"]);
  } else {
    addComponent("Navbar", []);
  }

  if (schema.ui.components.length === 0) {
    addComponent("OverviewPanel", []);
  }

  // If UI page/component has no matching API -> Add corresponding API endpoint
  schema.ui.components.forEach(comp => {
    if (Array.isArray(comp.endpoints)) {
      comp.endpoints.forEach(ep => {
        const parts = ep.split(" ");
        const normalizedEp = parts.length >= 2 ? `${parts[0].toUpperCase()} ${parts[1].toLowerCase()}` : ep;
        
        if (!apiEndpointKeys.has(normalizedEp) && parts.length >= 2) {
           console.log(`Fixed UI_API_MISMATCH: added corresponding API endpoint '${ep}' for UI component`);
           schema.api.endpoints.push({
             method: parts[0].toUpperCase(),
             path: parts[1],
             request: {},
             response: {}
           });
           apiEndpointKeys.add(normalizedEp);
        }
      });
    }
  });
}

export function repairAuth(schema: FullSchema, error: ValidationError): void {
  if (!schema.auth) schema.auth = { roles: {} };
  if (!schema.auth.roles) schema.auth.roles = {};

  const roles = Object.keys(schema.auth.roles);
  
  if (roles.length === 0) {
    schema.auth.roles["admin"] = ["*"];
    schema.auth.roles["user"] = ["read", "write"];
    console.log(`Fixed AUTH_ERROR: assigned default permissions for admin and user roles`);
  } else {
    // If roles exist but no permissions -> Assign default permissions
    roles.forEach(role => {
      const perms = schema.auth.roles[role];
      if (!Array.isArray(perms) || perms.length === 0) {
        if (role.toLowerCase() === "admin") {
          schema.auth.roles[role] = ["*"];
          console.log(`Fixed AUTH_ERROR: assigned default permissions to empty admin role`);
        } else {
          schema.auth.roles[role] = ["read", "write"];
          console.log(`Fixed AUTH_ERROR: assigned default permissions to empty role ${role}`);
        }
      }
    });
  }
}

export async function repairSchema(schema: FullSchema, errors: ValidationError[]): Promise<FullSchema> {
  // Modify schema in-place
  for (const error of errors) {
    if (error.type === "DB_ERROR") {
      repairDB(schema, error);
    } else if (error.type === "API_ERROR" || error.type === "API_DB_MISMATCH") {
      repairAPI(schema, error);
    } else if (error.type === "UI_ERROR" || error.type === "UI_API_MISMATCH") {
      repairUI(schema, error);
    } else if (error.type === "AUTH_ERROR") {
      repairAuth(schema, error);
    } else if (error.type === "CROSS_LAYER_ERROR") {
      if (error.message.includes("UI Component")) repairUI(schema, error);
      else if (error.message.includes("API Endpoint")) repairAPI(schema, error);
      else if (error.message.includes("Auth")) repairAuth(schema, error);
      else repairDB(schema, error);
    }
  }

  // Return full updated schema
  return schema;
}
