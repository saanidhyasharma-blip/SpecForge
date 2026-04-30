import { NextResponse } from "next/server";

function getBackendUrl(): string {
  const configuredUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";

  const trimmedUrl = configuredUrl.replace(/\/$/, "");

  if (/^https?:\/\//.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `http://${trimmedUrl}`;
}

export async function POST(request: Request) {
  try {
    const response = await fetch(`${getBackendUrl()}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(await request.json())
    });

    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach SpecForge backend";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
