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

export function generateUISchema(design: Design): UISchema {
  const pages: string[] = [];
  const components: UIComponent[] = [];

  design.flows.forEach((flow) => {
    const normalized = normalize(flow);

    if (normalized.includes("signs in") || normalized.includes("login")) {
      addUniquePage(pages, "LoginPage");
      // UI components must map to API endpoints
      addComponent(components, "LoginForm", ["POST /auth/login"]);
    }

    if (normalized.includes("dashboard")) {
      addUniquePage(pages, "DashboardPage");
      addComponent(components, "Navbar", ["POST /auth/logout", "GET /auth/me"]);
      addComponent(components, "StatsCard", ["GET /users", "GET /contacts", "GET /payments"]);
    }

    if (normalized.includes("contacts")) {
      addUniquePage(pages, "ContactsPage");
      addComponent(components, "ContactForm", ["POST /contacts"]);
      addComponent(components, "ContactTable", ["GET /contacts", "DELETE /contacts/:id", "PUT /contacts/:id"]);
    }

    if (normalized.includes("payment")) {
      addUniquePage(pages, "PaymentsPage");
      addComponent(components, "PaymentForm", ["POST /payments"]);
      addComponent(components, "PaymentTable", ["GET /payments", "DELETE /payments/:id", "PUT /payments/:id"]);
    }

    if (normalized.includes("allowed actions")) {
      addComponent(components, "Navbar", []);
    }
  });

  return {
    pages,
    components
  };
}
