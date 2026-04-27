import express from "express";
import cors from "cors";
import { runPipeline } from "./pipeline/orchestrator";

const app = express();
const port = 3000;

// Enable CORS explicitly handling the Vercel branch logic or strictly local 3001 Next.js
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
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
