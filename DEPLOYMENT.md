# 🚀 Deployment Guide - Vercel

This guide will help you deploy your AI Finance Manager to Vercel.

## Prerequisites

- ✅ GitHub repository (already set up)
- ✅ MongoDB Atlas account
- ✅ Google Gemini API key (optional, for AI features)

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0)
3. Create a database user
4. Whitelist IP addresses:
   - For Vercel: `0.0.0.0/0` (allows all IPs - required for serverless)
5. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Select your repository: `bsahil979/ai-finance-manager`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (or `ai-finance-manager` if repo root is different)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=ai-finance-manager
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **Important**: 
   - Replace `username` and `password` with your MongoDB credentials
   - Replace `cluster.mongodb.net` with your actual cluster URL
   - Get Gemini API key from [Google AI Studio](https://aistudio.google.com)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option B: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd ai-finance-manager
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? No (first time)
   - Project name: `ai-finance-manager`
   - Directory: `./`
   - Override settings? No

4. **Set Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add MONGODB_DB
   vercel env add GEMINI_API_KEY
   ```

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Step 3: Verify Deployment

1. Visit your deployment URL
2. Test the following:
   - ✅ Landing page loads
   - ✅ Registration/Login works
   - ✅ Dashboard displays
   - ✅ Can import transactions
   - ✅ MongoDB connection works

## Troubleshooting

### Build Fails

**Error**: `MONGODB_URI is not set`
- **Solution**: Make sure environment variables are set in Vercel dashboard

**Error**: `Module not found`
- **Solution**: Check that all dependencies are in `package.json`

### Runtime Errors

**Error**: `MongoDB connection failed`
- **Solution**: 
  - Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
  - Verify connection string is correct
  - Check database user has correct permissions

**Error**: `API routes return 500`
- **Solution**: Check Vercel function logs in dashboard

### Performance Issues

- Enable Vercel Analytics (optional)
- Use MongoDB Atlas connection pooling
- Consider upgrading MongoDB Atlas tier if needed

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ Yes | MongoDB Atlas connection string |
| `MONGODB_DB` | ⚠️ Optional | Database name (default: `ai-finance-manager`) |
| `GEMINI_API_KEY` | ⚠️ Optional | Google Gemini API key for AI features |

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Set up custom domain (optional)
3. ✅ Enable Vercel Analytics (optional)
4. ✅ Set up monitoring/alerts
5. ✅ Configure automatic deployments from `main` branch

## Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Test registration/login
- [ ] Test transaction import
- [ ] Test dashboard
- [ ] Test subscriptions detection
- [ ] Test alerts generation
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check MongoDB Atlas connection logs
3. Review environment variables
4. Check Next.js build output

---

**Happy Deploying! 🚀**

