# Deploy SpecForge

SpecForge is split into two deployable services:

- `backend`: Express API for `/health` and `/run`
- `frontend`: Next.js app with an `/api/run` proxy route that calls the backend

## Preferred: Deploy Both Services On Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render will read `render.yaml` and create:
   - `specforge-api`
   - `specforge-web`
4. When prompted for environment variables, set:

```text
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-specforge-web-url.onrender.com
```

After the services are live, test:

```bash
curl https://your-render-api-url.onrender.com/health
```

Then open `https://your-specforge-web-url.onrender.com`.

## Alternative: Frontend On Vercel, Backend On Render

1. Import the same GitHub repository into Vercel.
2. Set the project root directory to `frontend`.
3. Add these environment variables:

```text
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=https://your-render-api-url.onrender.com
```

4. Deploy.

## CORS

If the browser calls the backend directly, add the frontend URL to the Render backend's `FRONTEND_URL` environment variable and redeploy the backend.

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
