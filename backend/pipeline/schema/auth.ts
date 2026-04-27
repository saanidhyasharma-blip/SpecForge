import type { Design } from "../design";

export interface AuthSchema {
  roles: Record<string, string[]>;
}

const KNOWN_ROLES = new Set(["Admin", "User", "Member"]);

export function generateAuthSchema(design: Design): AuthSchema {
  const authSchema: AuthSchema = {
    roles: {}
  };

  const roles = design.entities.filter((entity) => KNOWN_ROLES.has(entity));
  const resources = design.entities.filter((entity) => !KNOWN_ROLES.has(entity));

  roles.forEach((role) => {
    if (role.toLowerCase() === "admin") {
      // admin gets full access
      authSchema.roles[role] = ["*"];
    } else if (role.toLowerCase() === "user") {
      // user gets limited access based on the entities present
      authSchema.roles[role] = resources.length > 0 
        ? resources.map(resource => `read:${resource.toLowerCase()}`)
        : ["read:limited"];
    } else {
      authSchema.roles[role] = [];
    }
  });

  // If no roles specified but the design usually implies users, we could add a default
  if (roles.length === 0 && design.flows.some((flow) => flow.toLowerCase().includes("signs in"))) {
      authSchema.roles["User"] = resources.length > 0 
        ? resources.map(resource => `read:${resource.toLowerCase()}`)
        : ["read:limited"];
  }

  return authSchema;
}
