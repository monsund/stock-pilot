# Frontend Deployment: Vercel

This guide explains how to deploy the Stock Pilot frontend (Next.js/React) to Vercel for production.

---

## Prerequisites
- Vercel account: https://vercel.com/signup
- GitHub/GitLab/Bitbucket repo connected to Vercel
- Node.js 18+ recommended

---

## Steps

### 1. Connect Repository
- Go to your Vercel dashboard and click "New Project".
- Import your Stock Pilot frontend repository.
- Select the `/apps/frontend` directory as the project root if prompted.

### 2. Configure Build Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Root Directory:** `/apps/frontend`

### 3. Environment Variables
- Add any required environment variables (e.g., API endpoints, keys) in the Vercel dashboard under Project Settings > Environment Variables.
- Example:
  - `NEXT_PUBLIC_API_BASE=https://your-backend-url`

### 4. Custom Domains (Optional)
- Add your custom domain in Vercel > Domains.
- Update DNS records as instructed by Vercel.

### 5. Deploy
- Click "Deploy" in Vercel.
- Vercel will build and deploy your frontend automatically on every push to the main branch.

---

## Notes
- Vercel automatically optimizes Next.js apps for static and dynamic rendering.
- For API routes, use Next.js API routes or connect to your backend via environment variables.
- If you use `.env.local`, make sure to add those variables in Vercel's dashboard.
- For troubleshooting, check the Vercel build logs and documentation: https://vercel.com/docs

---

## Useful Links
- [Vercel Docs: Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)

---

## Example Vercel Project Settings
```
Framework: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
Root Directory: apps/frontend
```

---

## Troubleshooting
- If you see build errors, check your dependencies and Node.js version.
- For SSR errors, ensure your API endpoints are reachable from Vercel.
- For environment issues, confirm all required variables are set in Vercel.

---

## Contact
For deployment support, open an issue in the repo or contact the maintainer.
