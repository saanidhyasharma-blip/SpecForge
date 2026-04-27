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

function mockExtractIntent(input: string): Intent {
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

    return typeof content === "string" ? parseIntent(content) : DEFAULT_INTENT;
  } catch {
    return mockExtractIntent(input);
  }
}
