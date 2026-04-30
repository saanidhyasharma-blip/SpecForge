# Deploy SpecForge

SpecForge is split into two deployable services:

- `backend`: Express API for `/health` and `/run`
- `frontend`: Next.js app that calls the API with `NEXT_PUBLIC_API_URL`

## 1. Deploy The Backend On Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render will read `render.yaml` and create `specforge-api`.
4. When prompted for environment variables, set:

```text
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

After the service is live, test:

```bash
curl https://your-render-api-url.onrender.com/health
```

## 2. Deploy The Frontend On Vercel

1. Import the same GitHub repository into Vercel.
2. Set the project root directory to `frontend`.
3. Add this environment variable:

```text
NEXT_PUBLIC_API_URL=https://your-render-api-url.onrender.com
```

4. Deploy.

## 3. Finish CORS

After Vercel gives you the frontend URL, add it to the Render backend's `FRONTEND_URL` environment variable and redeploy the backend.

For multiple frontend domains, use:

```text
FRONTEND_URLS=https://domain-one.vercel.app,https://domain-two.vercel.app
```

## Local Environment Files

Use these as starting points:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```
