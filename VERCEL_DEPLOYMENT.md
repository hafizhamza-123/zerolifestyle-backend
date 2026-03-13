# 🚀 Vercel Serverless Deployment Guide

This project has been refactored for serverless deployment on Vercel using Express.js.

## 📋 Project Structure

```
zero-back/
├── api/
│   └── index.js              # ⚡ Serverless handler (Vercel entry point)
├── src/
│   ├── app.js                # Express app configuration (no server)
│   ├── server.js             # Local development server
│   ├── prisma.js             # Prisma client with connection pooling
│   ├── controllers/          # Business logic
│   ├── routes/               # API endpoint definitions
│   ├── middlewares/          # Custom middleware
│   ├── utils/                # Helper functions
│   ├── validators/           # Input validation
│   └── config/               # Configuration files
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static files (favicon, robots.txt, etc.)
├── scripts/                  # Utility scripts
├── package.json              # Dependencies and scripts
├── vercel.json               # Vercel deployment config
├── .env                      # Environment variables (git ignored)
├── .env.example              # Example environment variables
└── README.md                 # Project documentation
```

## 🔧 Key Changes for Serverless

### 1. **Entry Point**
- Old: `src/app.js` with `app.listen()`
- New: `api/index.js` (Vercel serverless handler)

### 2. **Database Connection**
- Uses **connection pooling** to avoid exhausting connections on cold starts
- Reuses Prisma client across function invocations using global singleton pattern
- See: `src/prisma.js`

### 3. **App Configuration**
- `src/app.js` now only configures Express (no server startup)
- `src/server.js` handles local development server startup
- Clean separation between app logic and runtime concerns

### 4. **Local Development**
- Run: `npm run dev` (with auto-reload)
- Or: `npm start` (single run)
- Starts a traditional Node.js server on `http://localhost:3000`

### 5. **Serverless Handler**
- `api/index.js` wraps the Express app with `serverless-http`
- Automatically converts HTTP events to Express requests
- Manages database connections on cold starts

## 📦 Installation & Local Testing

### 1. Install Dependencies
```bash
npm install
```

This will automatically generate the Prisma client via the `postinstall` script.

### 2. Set Up Environment Variables
```bash
cp .env.example .env
# Edit .env with your actual values
```

Required variables:
- `DATABASE_URL` - MongoDB connection string
- `EMAIL_USER` & `EMAIL_PASS` - SMTP credentials
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `RESET_PASSWORD_SECRET` - JWT secrets
- `FRONTEND_URL` - Your frontend URL
- `CLOUDINARY_*` - Image storage credentials

### 3. Run Locally
```bash
npm run dev
```

You should see:
```
✓ Database connected successfully
✓ Server is running on http://localhost:3000
```

### 4. Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# API endpoints
curl http://localhost:3000/api/auth/...
curl http://localhost:3000/api/products/...
# etc.
```

## 🌐 Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

Or connect your GitHub repository for automatic deployments on push.

### 4. Set Environment Variables in Vercel Dashboard
1. Go to your project on Vercel
2. Click **Settings** > **Environment Variables**
3. Add all variables from your `.env` file:
   - `DATABASE_URL`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `RESET_PASSWORD_SECRET`
   - `FRONTEND_URL` (production URL)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### 5. Redeploy
```bash
vercel --prod
```

## 🧪 Test Vercel Deployment Locally

Before deploying to production, test the serverless environment locally:

```bash
npm install -g vercel          # Install Vercel CLI (if not done)
vercel dev                     # Start local Vercel environment
```

This simulates the production serverless environment and helps catch issues early.

## 🔐 Security Best Practices

1. **Never commit `.env` to git** ✓ Already in `.gitignore`
2. **Use strong secrets** - Generate random strings for JWT secrets
3. **Enable HTTPS** - Vercel does this automatically
4. **Set CORS correctly** - Update `FRONTEND_URL` in production
5. **Use environment variables** - Never hardcode secrets

## 📊 Performance Optimization

### Connection Pooling
- Prisma client is reused across function invocations
- Global singleton pattern prevents connection exhaustion
- See: `src/prisma.js`

### Cold Start Optimization
- Minimal dependencies
- Database connection established on first request
- Next.js integration ready (future)

### Monitoring
- Check Vercel Dashboard for function logs
- Monitor database connection pool
- Set up error tracking (e.g., Sentry)

## 🛠 Adding New Routes

### 1. Create a new route file
```javascript
// src/routes/yourroute.route.js
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Your endpoint" });
});

export default router;
```

### 2. Import in central routes
```javascript
// src/routes/index.js
import yourRoute from "./yourroute.route.js";
router.use("/yourroute", yourRoute);
```

### 3. Access at
```
GET /api/yourroute/
```

## 📝 Adding New Middleware

### 1. Create middleware file
```javascript
// src/middlewares/yourMiddleware.js
export const yourMiddleware = (req, res, next) => {
  // Do something
  next();
};
```

### 2. Add to app.js
```javascript
import { yourMiddleware } from "./middlewares/yourMiddleware.js";
app.use(yourMiddleware);
```

## 🐛 Troubleshooting

### Issue: "Cannot find module 'serverless-http'"
**Solution:** Run `npm install`

### Issue: Database connection timeout
**Solution:**
1. Check `DATABASE_URL` is correct
2. Verify MongoDB network access includes Vercel IPs
3. Use connection pooling (already implemented)

### Issue: Cold start is slow
**Solution:**
- This is normal for serverless (1-2 seconds on first request)
- Warm requests are much faster (~50ms)

### Issue: Environment variables not loaded
**Solution:**
1. Verify variables are set in Vercel dashboard
2. Redeploy after adding variables
3. Check variable names match exactly

### Issue: CORS errors in frontend
**Solution:**
1. Update `FRONTEND_URL` in environment variables
2. Ensure CORS middleware is configured correctly
3. Check browser console for exact error

## 📚 Useful Commands

```bash
npm run dev              # Start local development server
npm start                # Start production server
npm run build            # Run Prisma generate
npm run vercel-dev       # Test serverless locally
vercel dev               # Alias for above
vercel --prod            # Deploy to production
prisma studio           # Open Prisma data browser
```

## 🔗 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Express.js Docs](https://expressjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [serverless-http](https://github.com/dougmoscrop/serverless-http)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## ✅ Pre-Deployment Checklist

- [ ] All environment variables are set in Vercel
- [ ] Frontend URL is updated in environment variables
- [ ] Database connection is working
- [ ] CORS is configured for production domain
- [ ] All routes tested locally with `npm run dev`
- [ ] `vercel dev` runs without errors
- [ ] Git changes are committed
- [ ] `.env` is in `.gitignore`

## 📞 Support

For issues or questions, check:
1. Vercel Dashboard > Deployments > Logs
2. MongoDB Atlas > Logs
3. Cloudinary Dashboard > Logs
4. Application error handling

---

**Last Updated:** 2026-03-13
**Deployment Target:** Vercel Serverless Functions
**Runtime:** Node.js (default)
