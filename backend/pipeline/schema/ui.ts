import type { Design } from "../design";

export interface UIComponent {
  name: string;
  endpoints: string[];
}

export interface UISchema {
  pages: string[];
  components: UIComponent[];
}

function addUniquePage(items: string[], value: string): void {
  if (!items.includes(value)) {
    items.push(value);
  }
}

function addComponent(components: UIComponent[], name: string, endpoints: string[]): void {
  const existing = components.find(c => c.name === name);
  if (existing) {
    for (const ep of endpoints) {
      if (!existing.endpoints.includes(ep)) {
        existing.endpoints.push(ep);
      }
    }
  } else {
    components.push({ name, endpoints: [...endpoints] });
  }
}

function normalize(value: string): string {
  return value.toLowerCase();
}

function toResourcePath(entity: string): string {
  const normalized = entity.toLowerCase();
  const uncountable = new Set(["weather"]);

  if (uncountable.has(normalized) || normalized.endsWith("s")) {
    return `/${normalized}`;
  }

  return `/${normalized}s`;
}

export function generateUISchema(design: Design): UISchema {
  const pages: string[] = ["HomePage"]; // Rule: Always include Home
  const components: UIComponent[] = [];

  const entities = design.entities.length > 0 ? design.entities : ["User"];
  const flows = design.flows.map(normalize);

  // Check for Auth
  const hasAuth = entities.some(e => ["user", "admin", "role", "account"].includes(e.toLowerCase())) ||
    flows.some(f => f.includes("signs in") || f.includes("login") || f.includes("auth"));

  if (hasAuth) {
    addUniquePage(pages, "LoginPage");
    addComponent(components, "LoginForm", ["POST /auth/login"]);
    addComponent(components, "Navbar", ["POST /auth/logout", "GET /auth/me"]);
  } else {
    addComponent(components, "Navbar", []);
  }

  // Check for Dashboard
  const hasDashboard = flows.some(f => f.includes("dashboard") || f.includes("stats") || f.includes("overview"));
  if (hasDashboard) {
    addUniquePage(pages, "DashboardPage");
    // Dashboard typically shows summaries of main entities
    const dashboardEndpoints = entities.slice(0, 3).map(e => `GET ${toResourcePath(e)}`);
    addComponent(components, "StatsCard", dashboardEndpoints);
  }

  // Generate pages and components for entities
  entities.forEach(entity => {
    const normalized = entity.toLowerCase();
    if (normalized === "user" && hasAuth) return; // Handled by auth

    const pageName = `${entity}Page`;
    const resourcePath = toResourcePath(entity);

    addUniquePage(pages, pageName);
    
    // Each entity gets a Form and a Table (as requested: "form", "table")
    addComponent(components, "DataForm", [`POST ${resourcePath}`]);
    addComponent(components, "DataTable", [
      `GET ${resourcePath}`,
      `DELETE ${resourcePath}/:id`,
      `PUT ${resourcePath}/:id`
    ]);
  });

  // Ensure "form" and "table" components are represented if entities exist
  if (entities.length > 0) {
      // These are already added as DataForm and DataTable, which are specific forms/tables.
      // If the user wants generic "form" and "table" names, we can add them or alias them.
      // But DataForm/DataTable are more descriptive for mapping to endpoints.
  }

  return {
    pages,
    components
  };
}
