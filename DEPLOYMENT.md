# Deploying to Vercel

## Option 1: Deploy via Vercel Dashboard (Recommended - Easiest)

### Step 1: Push to GitHub
1. Create a new repository on GitHub (if you haven't already)
2. Initialize git in your project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Add your GitHub repository as remote:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. Click **"Deploy"**
6. Wait for deployment to complete (usually 2-3 minutes)

### Step 3: Access Your App
- Once deployed, Vercel will provide you with a URL like: `https://your-project-name.vercel.app`
- Your app is now live! 🎉

---

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (for first deployment)
- Project name? (Press Enter for default or enter custom name)
- Directory? (Press Enter for `./`)
- Override settings? **No**

### Step 4: Production Deployment
For production deployment:
```bash
vercel --prod
```

---

## Important Notes

### Environment Variables (if needed)
If you need to add environment variables:
1. Go to your project on Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add any required variables

### Custom Domain (Optional)
1. Go to your project on Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain

### Automatic Deployments
- Every push to `main` branch automatically triggers a production deployment
- Pull requests get preview deployments automatically

---

## Troubleshooting

### Build Errors
If you encounter build errors:
1. Test locally first: `npm run build`
2. Check Vercel build logs in the dashboard
3. Ensure all dependencies are in `package.json`

### API Routes
Your API routes (`/api/sheets`) will work automatically on Vercel - no additional configuration needed!

---

## Quick Deploy Button

You can also use this button (after pushing to GitHub):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_GITHUB_REPO_URL)

