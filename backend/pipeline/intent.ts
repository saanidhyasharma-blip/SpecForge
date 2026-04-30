export interface Intent {
  features: string[];
  roles: string[];
  entities: string[];
  constraints: string[];
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const DEFAULT_INTENT: Intent = {
  features: [],
  roles: [],
  entities: [],
  constraints: []
};

const INTENT_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "intent_extraction",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["features", "roles", "entities", "constraints"],
      properties: {
        features: {
          type: "array",
          items: { type: "string" }
        },
        roles: {
          type: "array",
          items: { type: "string" }
        },
        entities: {
          type: "array",
          items: { type: "string" }
        },
        constraints: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isIntent(value: unknown): value is Intent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isStringArray(record.features) &&
    isStringArray(record.roles) &&
    isStringArray(record.entities) &&
    isStringArray(record.constraints)
  );
}

function parseIntentObject(content: string): Intent | null {
  try {
    const parsed = JSON.parse(content);
    return isIntent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseIntent(content: string): Intent {
  const parsed = parseIntentObject(content);

  if (parsed) {
    return parsed;
  }

  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    const jsonSubstring = content.slice(start, end + 1);
    const reparsed = parseIntentObject(jsonSubstring);

    if (reparsed) {
      return reparsed;
    }
  }

  return DEFAULT_INTENT;
}

function addUnique(items: string[], value: string): void {
  const normalized = value.trim().toLowerCase();

  if (!normalized || items.some((item) => item.trim().toLowerCase() === normalized)) {
    return;
  }

  items.push(value.trim());
}

function inferIntentFromText(input: string): Intent {
  const text = input.toLowerCase();
  const intent: Intent = {
    features: [],
    roles: [],
    entities: [],
    constraints: []
  };

  const addFeature = (value: string) => addUnique(intent.features, value);
  const addRole = (value: string) => addUnique(intent.roles, value);
  const addEntity = (value: string) => addUnique(intent.entities, value);
  const addConstraint = (value: string) => addUnique(intent.constraints, value);

  if (/\b(login|sign in|signin|auth|authentication|account)\b/.test(text)) addFeature("auth");
  if (/\b(dashboard|analytics|stats|overview|report)\b/.test(text)) addFeature("dashboard");
  if (/\b(crm|contact|contacts|lead|leads)\b/.test(text)) {
    addFeature("crm");
    addEntity("contact");
  }
  if (/\b(payment|payments|billing|checkout|subscription)\b/.test(text)) {
    addFeature("payments");
    addEntity("payment");
  }
  if (/\b(weather|forecast|temperature|climate)\b/.test(text)) {
    addFeature("weather");
    addEntity("weather");
  }
  if (/\b(e-commerce|ecommerce|storefront|shop|shopping cart|cart|product|inventory)\b/.test(text)) {
    addFeature("commerce");
    addEntity("product");
    if (/\b(cart|checkout|order|orders)\b/.test(text)) addEntity("order");
  }
  if (/\b(task|tasks|todo|kanban|project board|project boards)\b/.test(text)) {
    addFeature("tasks");
    addEntity("task");
    if (/\b(project|board)\b/.test(text)) addEntity("project");
  }
  if (/\b(booking|appointment|reservation|schedule)\b/.test(text)) {
    addFeature("booking");
    addEntity("booking");
  }
  if (/\b(patient|doctor|clinic|medical)\b/.test(text)) {
    addEntity("patient");
    addEntity("doctor");
  }
  if (/\b(photo|media|post|comment|follow|social)\b/.test(text)) {
    addFeature("social");
    addEntity("post");
    if (/\b(comment|comments)\b/.test(text)) addEntity("comment");
  }
  if (/\b(employee|hr|leave|manager|working hours|timesheet)\b/.test(text)) {
    addFeature("hr");
    addEntity("employee");
    if (/\b(leave|request)\b/.test(text)) addEntity("leaveRequest");
  }
  if (/\b(recipe|recipes)\b/.test(text)) {
    addFeature("recipes");
    addEntity("recipe");
  }
  if (/\b(expense|expenses|budget|finance|transaction|transactions)\b/.test(text)) {
    addFeature("finance");
    addEntity("transaction");
    if (/\b(budget|budgets)\b/.test(text)) addEntity("budget");
  }
  if (/\b(chat|message|messaging)\b/.test(text)) {
    addFeature("chat");
    addEntity("message");
  }

  if (/\badmin\b/.test(text)) addRole("admin");
  if (/\b(user|users|customer|customers|member|members|employee|employees|patient|patients)\b/.test(text)) addRole("user");
  if (/\bmanager\b/.test(text)) addRole("manager");
  if (/\bmoderator\b/.test(text)) addRole("moderator");

  if (/\btypescript\b/.test(text)) addConstraint("typescript");
  if (/\bminimal|simple|lightweight\b/.test(text)) addConstraint("minimal");
  if (/\bmobile|phone|responsive\b/.test(text)) addConstraint("responsive");

  return intent;
}

function mergeIntent(primary: Intent, fallback: Intent): Intent {
  const merged: Intent = {
    features: [...primary.features],
    roles: [...primary.roles],
    entities: [...primary.entities],
    constraints: [...primary.constraints]
  };

  fallback.features.forEach((item) => addUnique(merged.features, item));
  fallback.roles.forEach((item) => addUnique(merged.roles, item));
  fallback.entities.forEach((item) => addUnique(merged.entities, item));
  fallback.constraints.forEach((item) => addUnique(merged.constraints, item));

  return merged;
}

function mockExtractIntent(input: string): Intent {
  const inferred = inferIntentFromText(input);

  if (
    inferred.features.length > 0 ||
    inferred.roles.length > 0 ||
    inferred.entities.length > 0 ||
    inferred.constraints.length > 0
  ) {
    return inferred;
  }

  const text = input.toLowerCase();

  return {
    features: [
      ...(text.includes("login") ? ["login"] : []),
      ...(text.includes("dashboard") ? ["dashboard"] : []),
      ...(text.includes("contacts") ? ["contacts"] : []),
      ...(text.includes("payments") ? ["payments"] : []),
      ...(text.includes("crm") ? ["crm"] : [])
    ],
    roles: [
      ...(text.includes("admin") ? ["admin"] : []),
      ...(text.includes("user") ? ["user"] : [])
    ],
    entities: [
      ...(text.includes("contacts") ? ["contact"] : []),
      ...(text.includes("payments") ? ["payment"] : []),
      ...(text.includes("project") ? ["project"] : [])
    ],
    constraints: [
      ...(text.includes("typescript") ? ["typescript"] : []),
      ...(text.includes("minimal") ? ["minimal"] : [])
    ]
  };
}

export async function extractIntent(input: string): Promise<Intent> {
  const apiKey = process.env.GEMINI_API_KEY;
  const inferredIntent = inferIntentFromText(input);
  const prompt = `
You are a system that extracts structured intent.

Return ONLY JSON. No explanation. No markdown fences.

Schema:
{
  "features": string[],
  "roles": string[],
  "entities": string[],
  "constraints": string[]
}

Rules:
- Always include all keys
- If missing, return empty arrays
- Do not invent unnecessary items
- Do not invent entities not mentioned or implied
- Keep outputs minimal and accurate

Input:
${input}
`;

  if (!apiKey) {
    return mockExtractIntent(input);
  }

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
      return mockExtractIntent(input);
    }

    const result = await response.json() as any;
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    const parsedIntent = typeof content === "string" ? parseIntent(content) : DEFAULT_INTENT;
    return mergeIntent(parsedIntent, inferredIntent);
  } catch {
    return mockExtractIntent(input);
  }
}
