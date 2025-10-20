# 🚀 Vercel Deployment Guide
## Gymnastics Training Manager

This guide will help you deploy your gymnastics portal to Vercel in under 30 minutes.

---

## Prerequisites

- GitHub account
- Vercel account (free)
- Resend account (free)
- Your code ready to deploy

---

## Step-by-Step Deployment

### 1️⃣ Fix ESLint Errors (5 minutes)

```bash
cd /home/marcel/gymnastics-manager

# Run the fix script
./fix-eslint.sh

# Or manually:
npm run lint -- --fix
npm run build
```

If build fails, see "Manual Fixes" section below.

---

### 2️⃣ Push to GitHub (5 minutes)

```bash
# Initialize git (if not already done)
git init

# Create .gitignore if needed
cat > .gitignore << 'EOF'
node_modules/
.next/
.env*.local
*.log
.DS_Store
EOF

# Commit your code
git add .
git commit -m "Ready for production deployment"

# Create GitHub repository
# Go to https://github.com/new
# Name: gymnastics-manager
# Don't initialize with README

# Push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gymnastics-manager.git
git push -u origin main
```

---

### 3️⃣ Deploy to Vercel (10 minutes)

#### A. Connect GitHub to Vercel

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Click **"New Project"**
4. Click **"Import Git Repository"**
5. Select **"gymnastics-manager"**
6. Click **"Import"**

#### B. Configure Project Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset:** Next.js
- **Root Directory:** ./
- **Build Command:** `next build`
- **Output Directory:** .next
- **Install Command:** `npm install`

**⚠️ IMPORTANT:** Before clicking Deploy, add environment variables!

---

### 4️⃣ Add Environment Variables (5 minutes)

In Vercel Dashboard > Your Project > Settings > Environment Variables

Add these variables:

#### Database
```
DATABASE_URL=postgresql://neondb_owner:npg_MCJ0IhkwcnR2@ep-red-sky-agftneyp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### Authentication (Generate new secret!)
```bash
# Generate new secret locally:
openssl rand -base64 32
# Copy the output
```

```
NEXTAUTH_SECRET=<PASTE_GENERATED_SECRET_HERE>
NEXTAUTH_URL=https://your-project.vercel.app
```
(Replace `your-project` with your actual Vercel project name)

#### Application
```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_APP_NAME=Gymnastics Training Manager
NEXT_PUBLIC_MIN_CANCELLATION_HOURS=2
NEXT_PUBLIC_MIN_CANCELLATION_REASON_LENGTH=10
```

#### Email
```
RESEND_API_KEY=re_5pLyiD3m_3uyGJJPW3cn9VceyRRqNWg3j
EMAIL_FROM=onboarding@resend.dev
```

**Note:** You'll update `EMAIL_FROM` later after configuring your custom domain.

---

### 5️⃣ Deploy! 🚀

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. ✅ Your site is live!

Your app will be at: `https://your-project.vercel.app`

---

### 6️⃣ Run Database Migrations (5 minutes)

After first deployment, you need to run migrations:

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull production environment variables
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy

# Seed initial data (trainer account)
npx prisma db seed
```

#### Option B: Using Vercel Dashboard

1. Go to Project > Settings > General
2. Scroll to "Build & Development Settings"
3. Change Build Command to:
   ```
   prisma migrate deploy && next build
   ```
4. Redeploy (Deployments > Latest > ⋯ > Redeploy)

---

### 7️⃣ Configure Custom Email Domain (Optional, 15 minutes)

For professional emails like `noreply@yourdomain.com`:

1. **Buy Domain** (if you don't have one)
   - Vercel Domains: https://vercel.com/domains
   - Or use Namecheap, GoDaddy, etc.

2. **Configure Domain in Resend**
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain (e.g., `yourdomain.com`)
   - Add DNS records shown by Resend to your domain provider:
     - TXT record for SPF
     - CNAME records for DKIM
     - CNAME for tracking

3. **Verify Domain**
   - Click "Verify" in Resend
   - Wait 5-30 minutes for DNS propagation

4. **Update Environment Variable**
   - Go to Vercel > Settings > Environment Variables
   - Edit `EMAIL_FROM`
   - Change to: `noreply@yourdomain.com`
   - Redeploy

---

### 8️⃣ Configure Custom Domain for App (Optional, 10 minutes)

Instead of `your-project.vercel.app`, use `yourdomain.com`:

1. Go to Vercel > Project > Settings > Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `gym.yourdomain.com` or `yourdomain.com`)
4. Add DNS records to your domain provider:
   - Type: A
   - Name: @ (or subdomain)
   - Value: (shown by Vercel)
5. Wait for DNS propagation (5-30 minutes)
6. Update environment variables:
   - `NEXTAUTH_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
7. Redeploy

---

## 🧪 Post-Deployment Testing

### 1. Test Login Accounts

The seed script creates these accounts:

- **Trainer:** `trainer@gym.com` / `trainer123`
- **Admin:** `admin@gym.com` / `admin123`
- **Test Athlete:** `athlete@test.com` / `athlete123`

**⚠️ IMPORTANT:** Change these passwords immediately!

### 2. Test Email System

1. Login as trainer: `https://your-domain.com/login`
2. Go to: `https://your-domain.com/trainer/test-email`
3. Enter your email
4. Test all 4 email types
5. Check your inbox

### 3. Test Key Features

**Athlete Flow:**
- [ ] Register new account
- [ ] Can't login (pending approval)
- [ ] Trainer approves + configures
- [ ] Login works
- [ ] Schedule shows correct sessions
- [ ] Can cancel session with reason
- [ ] Email received for approval

**Trainer Flow:**
- [ ] Login as trainer
- [ ] See pending approvals
- [ ] Approve athlete
- [ ] Configure training schedule
- [ ] View sessions for today
- [ ] Mark attendance
- [ ] Upload training plan
- [ ] All athletes receive email

### 4. Test Mobile

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1024px+)
4. Verify:
   - [ ] Menu works
   - [ ] Forms are usable
   - [ ] Sessions grid works
   - [ ] No horizontal scroll

---

## 🐛 Troubleshooting

### Build Fails

**Error:** TypeScript/ESLint errors
```bash
# Run locally first:
npm run build

# Fix errors shown
# Then push to GitHub
git add .
git commit -m "Fix build errors"
git push
```

### Database Connection Error

**Error:** "Can't reach database server"

- Check `DATABASE_URL` in Vercel environment variables
- Ensure no extra spaces
- Verify Neon database is running
- Check connection string format

### Emails Not Sending

**Error:** "Failed to send email"

- Verify `RESEND_API_KEY` in Vercel
- Check Resend dashboard for quota
- Verify sender email is verified in Resend
- Check spam folder

### 404 on Routes

**Error:** Routes not found

- Verify build succeeded
- Check Vercel deployment logs
- Ensure middleware is configured
- Redeploy

### Can't Login

**Error:** "Unauthorized" or redirect loop

- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies
- Try incognito mode

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard

- **Deployments:** See all deployments and logs
- **Analytics:** Track page views, performance
- **Logs:** Real-time function logs
- **Speed Insights:** Core Web Vitals

### Resend Dashboard

- **Emails:** Track delivery, opens, clicks
- **API Logs:** See all email send attempts
- **Bounces:** Monitor delivery issues

### Neon Dashboard

- **Queries:** Monitor database performance
- **Storage:** Track database size
- **Backups:** Automatic daily backups

---

## 💡 Next Steps After Deployment

### 1. Secure Your Accounts

```bash
# Login to your app and change passwords
# Trainer: /trainer/settings
# Admin: /admin/settings
```

### 2. Invite Real Users

1. Share registration link: `https://yourdomain.com/register`
2. Athletes register
3. You approve and configure them
4. They receive email and can login

### 3. Customize Branding

Update these in environment variables:
- `NEXT_PUBLIC_APP_NAME` - Your gym name
- Customize colors in `tailwind.config.ts`
- Add your logo to `/public`

### 4. Set Up Monitoring (Recommended)

- **Sentry** for error tracking (free tier)
- **Vercel Analytics** for usage stats
- **Resend Webhooks** for email events

### 5. Plan for Growth

When you outgrow free tiers:
- **Vercel Pro:** $20/month (better performance)
- **Neon Pro:** $20/month (more storage)
- **Resend Pro:** $20/month (more emails)

---

## 🎯 Success Metrics

Your deployment is successful when:

- ✅ Site loads at your Vercel URL
- ✅ Can login as trainer
- ✅ Can register new athlete
- ✅ Emails are being delivered
- ✅ Mobile version works
- ✅ No console errors
- ✅ Build status is green

---

## 🆘 Need Help?

### Common Issues

1. **Build fails:** Run `npm run build` locally first
2. **Emails fail:** Check Resend API key and quota
3. **Database errors:** Verify connection string
4. **Routes 404:** Check middleware configuration

### Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Resend Docs: https://resend.com/docs

---

## ✅ Deployment Checklist

Before going live with real users:

- [ ] ESLint errors fixed
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Initial data seeded
- [ ] Test login works
- [ ] Email delivery tested
- [ ] Mobile responsiveness verified
- [ ] Default passwords changed
- [ ] Custom domain configured (optional)
- [ ] Email domain configured (optional)
- [ ] Monitoring set up
- [ ] User documentation ready

---

## 🎉 Congratulations!

Your Gymnastics Training Manager is now live on Vercel! 

Share the link with your gym members and start managing training sessions more efficiently.

**Your app:** `https://your-project.vercel.app`

Good luck! 🚀
