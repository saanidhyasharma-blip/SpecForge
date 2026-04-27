import type { FullSchema } from "../pipeline/schema";

export interface SimulationResult {
  success: boolean;
  message: string;
}

export function simulateExecution(schema: FullSchema): SimulationResult {
  // --- 1. Base Layer Checks ---
  
  // DB Checks
  if (!schema.db || !Array.isArray(schema.db.tables) || schema.db.tables.length === 0) {
    return { success: false, message: "Execution failed: DB has no tables." };
  }
  for (const table of schema.db.tables) {
    if (!Array.isArray(table.fields) || table.fields.length === 0) {
      return { success: false, message: `Execution failed: DB table '${table.name || 'unknown'}' has no fields.` };
    }
  }

  // API Checks
  if (!schema.api || !Array.isArray(schema.api.endpoints) || schema.api.endpoints.length === 0) {
    return { success: false, message: "Execution failed: API has no endpoints." };
  }
  for (const endpoint of schema.api.endpoints) {
    if (!endpoint.path || !endpoint.method) {
      return { success: false, message: `Execution failed: API endpoint is missing path or method.` };
    }
  }

  // UI Checks
  if (!schema.ui || !Array.isArray(schema.ui.pages) || schema.ui.pages.length === 0) {
    return { success: false, message: "Execution failed: UI has no pages." };
  }

  // Auth Checks
  if (!schema.auth || !schema.auth.roles || typeof schema.auth.roles !== "object") {
    return { success: false, message: "Execution failed: Auth schema missing roles mapping." };
  }
  
  const roles = Object.keys(schema.auth.roles);
  if (roles.length === 0) {
    return { success: false, message: "Execution failed: Auth has no roles defined." };
  }
  for (const [role, permissions] of Object.entries(schema.auth.roles)) {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return { success: false, message: `Execution failed: Auth role '${role}' has no permissions assigned.` };
    }
  }


  // --- 2. Advanced Cross-Layer Execution Simulation Checks ---

  const dbTableNames = new Set(schema.db.tables.map(t => (t.name || "").toLowerCase()));
  const apiEndpointKeys = new Set(schema.api.endpoints.map(e => `${e.method.toUpperCase()} ${e.path.toLowerCase()}`));
  const apiPaths = new Set(schema.api.endpoints.map(e => e.path.toLowerCase()));

  // A. Ensure each API endpoint corresponds to a DB table
  for (const ep of schema.api.endpoints) {
    if (ep.path && ep.path.startsWith("/")) {
      const resourceMatch = ep.path.split("/")[1];
      if (resourceMatch && resourceMatch.toLowerCase() !== "auth") {
        const possibleTableName = resourceMatch.toLowerCase();
        const singularTableName = possibleTableName.endsWith('s') ? possibleTableName.slice(0, -1) : possibleTableName;
        
        if (!dbTableNames.has(possibleTableName) && !dbTableNames.has(singularTableName)) {
           return { success: false, message: `Execution failed (API->DB mismatch): API endpoint '${ep.path}' has no corresponding DB table.` };
        }
      }
    }
  }

  // B. Ensure UI pages/components map to API endpoints
  if (Array.isArray(schema.ui.components)) {
    for (const comp of schema.ui.components) {
      if (Array.isArray(comp.endpoints)) {
        for (const ep of comp.endpoints) {
          const parts = ep.split(" ");
          const normalizedEp = parts.length >= 2 ? `${parts[0].toUpperCase()} ${parts[1].toLowerCase()}` : ep.toLowerCase();
          
          if (!apiEndpointKeys.has(normalizedEp)) {
            return { success: false, message: `Execution failed (UI->API mismatch): UI component '${comp.name}' references non-existent API endpoint '${ep}'.` };
          }
        }
      }
    }
  }

  // C. Ensure auth roles apply to API endpoints
  for (const [role, permissions] of Object.entries(schema.auth.roles)) {
    for (const perm of permissions as string[]) {
      if (perm.includes(":")) {
        const [, resource] = perm.split(":");
        if (resource !== "*" && resource !== "limited" && resource !== "own") {
          // Verify that this specific resource maps to an actual existing API endpoint
          const possiblePath = `/${resource.toLowerCase()}`;
          const pluralPath = `${possiblePath}s`;
          
          const hasApiMatch = Array.from(apiPaths).some(p => p.startsWith(possiblePath) || p.startsWith(pluralPath));
          if (!hasApiMatch) {
            return { success: false, message: `Execution failed (AUTH->API mismatch): Auth role '${role}' controls '${resource}', but no API endpoints exist to handle it.` };
          }
        }
      }
    }
  }

  // All dependencies cleanly wired
  return {
    success: true,
    message: "Application is executable"
  };
}
