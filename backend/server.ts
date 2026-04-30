import "dotenv/config";
import express from "express";
import cors from "cors";
import { runPipeline } from "./pipeline/orchestrator";

const app = express();
const port = Number(process.env.PORT) || 3000;

function getAllowedOrigins(): string[] {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...configuredOrigins
  ];
}

// Enable CORS for local development and production
const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ["GET", "POST"]
}));

// Enable JSON body parsing for the POST pipeline parameters
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post("/run", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }
    const result = await runPipeline(prompt);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
