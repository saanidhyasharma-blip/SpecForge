import type { Design } from "../design";

export interface AuthSchema {
  roles: Record<string, string[]>;
}

const KNOWN_ROLES = new Set(["Admin", "User", "Member", "Manager", "Moderator"]);

export function generateAuthSchema(design: Design): AuthSchema {
  const entities = design.entities;
  const flows = design.flows.map(f => f.toLowerCase());
  
  const authSchema: AuthSchema = {
    roles: {}
  };

  const roles = entities.filter((entity) => KNOWN_ROLES.has(entity));
  const resources = entities.filter((entity) => !KNOWN_ROLES.has(entity));
  const hasAuth = roles.length > 0 || 
    entities.some(e => ["user", "admin", "role", "account"].includes(e.toLowerCase())) ||
    flows.some(f => f.includes("signs in") || f.includes("login") || f.includes("auth"));

  if (!hasAuth) {
    return authSchema;
  }

  const effectiveRoles = roles.length > 0 ? roles : ["User"];

  effectiveRoles.forEach((role) => {
    if (role.toLowerCase() === "admin") {
      authSchema.roles[role] = ["*"];
    } else if (role.toLowerCase() === "manager" || role.toLowerCase() === "moderator") {
      authSchema.roles[role] = resources.length > 0
        ? resources.map(resource => `read:${resource.toLowerCase()}`)
        : ["read:limited"];
    } else if (role.toLowerCase() === "user") {
      authSchema.roles[role] = resources.length > 0 
        ? resources.map(resource => `read:${resource.toLowerCase()}`)
        : ["read:limited"];
    } else {
      authSchema.roles[role] = ["read:limited"];
    }
  });

  return authSchema;
}
