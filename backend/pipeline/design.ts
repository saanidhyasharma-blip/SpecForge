import type { Intent } from "./intent";

export interface Design {
  entities: string[];
  relationships: string[];
  flows: string[];
}

export type SystemDesign = Design;

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const DEFAULT_DESIGN: SystemDesign = {
  entities: [],
  relationships: [],
  flows: []
};

const DESIGN_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "system_design",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["entities", "relationships", "flows"],
      properties: {
        entities: {
          type: "array",
          items: { type: "string" }
        },
        relationships: {
          type: "array",
          items: { type: "string" }
        },
        flows: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function addUnique(items: Set<string>, value: string): void {
  const normalized = normalize(value);

  if (normalized) {
    items.add(titleCase(normalized));
  }
}

function includesAny(values: string[], targets: string[]): boolean {
  return values.some((value) => targets.includes(normalize(value)));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSystemDesign(value: unknown): value is SystemDesign {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isStringArray(record.entities) &&
    isStringArray(record.relationships) &&
    isStringArray(record.flows)
  );
}

function parseDesignObject(content: string): SystemDesign | null {
  try {
    const parsed = JSON.parse(content);
    return isSystemDesign(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseDesign(content: string): SystemDesign | null {
  const parsed = parseDesignObject(content);

  if (parsed) {
    return parsed;
  }

  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return parseDesignObject(content.slice(start, end + 1));
  }

  return null;
}

function addUniqueText(items: string[], value: string): void {
  const normalized = normalize(value);

  if (!normalized) {
    return;
  }

  const exists = items.some((item) => normalize(item) === normalized);

  if (!exists) {
    items.push(value.trim());
  }
}

function isCardinalityRelationship(value: string): boolean {
  const normalized = normalize(value);
  return normalized.includes(" has one ") || normalized.includes(" has many ");
}

function buildRuleBasedDesign(intent: Intent): SystemDesign {
  const features = intent.features.map(normalize);
  const roles = intent.roles.map(normalize);
  const roleEntities = new Set(roles.map(titleCase));
  const entities = new Set<string>();
  const relationships: string[] = [];
  const flows: string[] = [];

  intent.entities.forEach((entity) => addUnique(entities, entity));
  roles.forEach((role) => addUnique(entities, role));

  if (includesAny(features, ["login", "auth", "authentication"])) {
    addUnique(entities, "user");
    flows.push("User signs in");
  }

  if (includesAny(features, ["contacts", "crm"])) {
    addUnique(entities, "contact");
    flows.push("User manages contacts");
  }

  if (includesAny(features, ["payments", "billing"])) {
    addUnique(entities, "payment");
    addUnique(entities, "subscription");
    flows.push("User completes payment");
  }

  if (includesAny(features, ["dashboard"])) {
    flows.push("User views dashboard");
  }

  roles.forEach((role) => {
    const roleName = titleCase(role);
    addUniqueText(flows, `${roleName} performs allowed actions`);
  });

  if (entities.has("Admin") && entities.has("User")) {
    relationships.push("Admin has many Users");
  }

  const entityList = Array.from(entities);

  entityList.forEach((entity) => {
    if (!entities.has("User") || entity === "User" || roleEntities.has(entity)) {
      return;
    }

    if (entity === "Contact") {
      addUniqueText(relationships, "User has many Contacts");
    } else if (entity === "Payment") {
      addUniqueText(relationships, "User has many Payments");
    } else if (entity === "Subscription") {
      addUniqueText(relationships, "User has one Subscription");
    }
  });

  if (entities.has("Payment") && entities.has("Subscription")) {
    addUniqueText(relationships, "Subscription has many Payments");
  }

  return {
    entities: entityList,
    relationships,
    flows
  };
}

function getAllowedEntities(intent: Intent, ruleBasedDesign: SystemDesign): Set<string> {
  const allowedEntities = new Set<string>();

  ruleBasedDesign.entities.forEach((entity) => allowedEntities.add(normalize(entity)));
  intent.entities.forEach((entity) => allowedEntities.add(normalize(titleCase(entity))));
  intent.roles.forEach((role) => allowedEntities.add(normalize(titleCase(role))));

  return allowedEntities;
}

function mergeDesigns(ruleBasedDesign: SystemDesign, llmDesign: SystemDesign, intent: Intent): SystemDesign {
  const allowedEntities = getAllowedEntities(intent, ruleBasedDesign);
  const merged: SystemDesign = {
    entities: [...ruleBasedDesign.entities],
    relationships: [...ruleBasedDesign.relationships],
    flows: [...ruleBasedDesign.flows]
  };

  llmDesign.entities.forEach((entity) => {
    const normalized = normalize(entity);

    if (allowedEntities.has(normalized)) {
      addUniqueText(merged.entities, titleCase(entity));
    }
  });

  llmDesign.relationships.forEach((relationship) => {
    const normalized = normalize(relationship);
    const usesKnownEntity = Array.from(allowedEntities).some((entity) => normalized.includes(entity));

    if (usesKnownEntity && isCardinalityRelationship(relationship)) {
      addUniqueText(merged.relationships, relationship);
    }
  });

  llmDesign.flows.forEach((flow) => {
    addUniqueText(merged.flows, flow);
  });

  return merged;
}

async function generateLlmDesign(intent: Intent, ruleBasedDesign: SystemDesign): Promise<SystemDesign | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const prompt = `
You generate a minimal system design from extracted intent.

Return ONLY JSON. No explanation. No markdown fences.

Schema:
{
  "entities": string[],
  "relationships": string[],
  "flows": string[]
}

Rules:
- Keep output deterministic and minimal
- Do not invent unnecessary entities
- Only include entities directly derived from features or intent
- Use only entities mentioned, implied by features, or already present in the rule-based design
- If feature includes "payments", include "Subscription"
- If feature includes "auth", include "User"
- Define clear relationships using "has one" or "has many" format
- Write flows as user actions, not descriptions
- Always include all keys

Intent:
${JSON.stringify(intent)}

Rule-based design:
${JSON.stringify(ruleBasedDesign)}
`;

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json() as any;
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    return typeof content === "string" ? parseDesign(content) : null;
  } catch {
    return null;
  }
}

export async function generateDesign(intent: Intent): Promise<SystemDesign> {
  try {
    const ruleBasedDesign = buildRuleBasedDesign(intent);
    const llmDesign = await generateLlmDesign(intent, ruleBasedDesign);

    return llmDesign ? mergeDesigns(ruleBasedDesign, llmDesign, intent) : ruleBasedDesign;
  } catch {
    return DEFAULT_DESIGN;
  }
}
