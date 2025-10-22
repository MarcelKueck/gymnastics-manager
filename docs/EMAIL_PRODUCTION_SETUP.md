# Email Production Setup Guide

## Prerequisites ✅

You've already completed:
- ✅ Configured DNS records for `turnen.svesting.de` in Resend
- ✅ Domain verification in Resend

## Step 1: Verify Domain Status in Resend

1. Log in to [Resend Dashboard](https://resend.com/domains)
2. Check that `turnen.svesting.de` shows as **"Verified"**
3. Note down the recommended sender email format (usually `noreply@turnen.svesting.de`)

## Step 2: Configure Environment Variables in Vercel

You need to add/update these environment variables in your Vercel project:

### Access Vercel Environment Variables

1. Go to your Vercel dashboard: https://vercel.com
2. Select your project (gymnastics-manager)
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Required Environment Variables

Add or update these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` (your actual API key from Resend) | Production, Preview, Development |
| `EMAIL_FROM` | `noreply@turnen.svesting.de` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://turnen.svesting.de` (or your actual production URL) | Production |
| `NEXTAUTH_URL` | (leave as preview URL) | Preview |
| `NEXTAUTH_SECRET` | (your existing secret) | Already configured |
| `DATABASE_URL` | (your existing database URL) | Already configured |

### Important Notes:

- **RESEND_API_KEY**: Get this from [Resend Dashboard > API Keys](https://resend.com/api-keys)
- **EMAIL_FROM**: Must use your verified domain `turnen.svesting.de`
  - Recommended format: `noreply@turnen.svesting.de`
  - Alternative: `info@turnen.svesting.de` or `system@turnen.svesting.de`
- **NEXTAUTH_URL**: Must match your actual production domain

## Step 3: Redeploy Your Application

After setting the environment variables:

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click the **⋮** (three dots) menu
4. Click **Redeploy**
5. Check **"Use existing Build Cache"** (faster)
6. Click **Redeploy**

OR simply push a new commit to trigger automatic deployment:

```bash
git add .
git commit -m "Configure production email settings"
git push
```

## Step 4: Test Email Functionality in Production

### Test 1: Use Test Email Page

1. Log in as trainer on production: `https://turnen.svesting.de/login`
2. Navigate to: `https://turnen.svesting.de/trainer/test-email`
3. Enter your email address
4. Test all 4 email types
5. Verify emails arrive in your inbox

### Test 2: Test Athlete Approval Flow

1. Register a new test athlete
2. Approve and configure the athlete as trainer
3. Check the athlete's email for approval notification

### Test 3: Monitor Email Sending

1. Check Vercel logs: **Deployments > [Latest] > Runtime Logs**
2. Look for email sending logs:
   - ✅ Success: `"✅ Approval email sent:"`
   - ❌ Errors: `"❌ Error sending approval email:"`

## Step 5: Verify Email Deliverability

### Check Resend Dashboard

1. Go to [Resend Dashboard > Emails](https://resend.com/emails)
2. You should see sent emails with their status:
   - ✅ **Delivered**: Email successfully sent
   - 📬 **Queued**: Email is being processed
   - ❌ **Bounced**: Email address invalid
   - 🚫 **Complained**: Marked as spam

### Check Spam Score

1. Send a test email to yourself
2. Check if it lands in inbox or spam folder
3. If in spam:
   - Verify all DNS records are correct in Resend
   - Check SPF, DKIM, and DMARC records
   - Wait 24-48 hours for DNS propagation

## Step 6: Production Email Testing Checklist

Use this checklist to verify all email types work correctly:

- [ ] **Athlete Approval Email**
  - Register new athlete
  - Approve as trainer
  - Verify email received with correct training config

- [ ] **Schedule Change Email**
  - Edit athlete's training configuration
  - Verify email received with old vs new schedule

- [ ] **Training Plan Upload Email**
  - Upload a new training plan PDF
  - Verify all approved athletes receive email
  - Check email includes correct plan details

- [ ] **Absence Alert Email**
  - Mark athlete as unexcused 3 times
  - Verify trainer receives alert
  - Verify athlete receives alert (if enabled)

## Troubleshooting

### Error: "Missing API key"

**Problem**: `RESEND_API_KEY` not found

**Solution**:
1. Add `RESEND_API_KEY` in Vercel environment variables
2. Redeploy the application
3. Verify the key is correct in Resend dashboard

### Error: "Invalid sender email"

**Problem**: Email sender not verified

**Solution**:
1. Check domain verification in Resend
2. Ensure `EMAIL_FROM` uses verified domain
3. Format: `noreply@turnen.svesting.de`
4. Wait for DNS propagation (up to 48 hours)

### Emails Going to Spam

**Problem**: Emails land in spam folder

**Solution**:
1. Verify SPF record: `v=spf1 include:_spf.resend.com ~all`
2. Verify DKIM record: Check Resend dashboard for correct value
3. Add DMARC record: `v=DMARC1; p=none; rua=mailto:dmarc@turnen.svesting.de`
4. Wait 24-48 hours for DNS propagation
5. Send test emails to multiple providers (Gmail, Outlook, etc.)

### Emails Not Sending at All

**Problem**: No emails being sent

**Solution**:
1. Check Vercel runtime logs for errors
2. Verify `RESEND_API_KEY` is correct
3. Check Resend dashboard for API errors
4. Verify domain is active in Resend
5. Check API rate limits (3,000/month on free tier)

### Wrong Sender Email Displayed

**Problem**: Emails show wrong sender

**Solution**:
1. Update `EMAIL_FROM` in Vercel to `noreply@turnen.svesting.de`
2. Redeploy application
3. Clear browser cache
4. Send new test email

## DNS Configuration Reference

Your DNS records for `turnen.svesting.de` should look like this:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

### DKIM Record
```
Type: TXT
Name: resend._domainkey
Value: [Provided by Resend dashboard - starts with "p="]
```

### DMARC Record (Optional but Recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@turnen.svesting.de
```

## Email Volume and Costs

### Resend Free Tier
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ Multiple verified domains

### Expected Usage Estimate
For a gymnastics club with ~50 athletes:
- Approval emails: ~5-10/month
- Schedule changes: ~10-20/month
- Training plan uploads: ~4-8 uploads × 50 athletes = 200-400/month
- Absence alerts: ~10-30/month

**Total**: ~225-460 emails/month ✅ **Well within free tier!**

### If You Need More
- Upgrade to paid plan: Starting at $20/month for 50,000 emails
- Monitor usage in Resend dashboard

## Email Templates and Branding

All emails include:
- ✅ Professional header with club branding
- ✅ Club green color (#509f28)
- ✅ Mobile-responsive design
- ✅ Clear call-to-action buttons
- ✅ German language
- ✅ Automatic generation notice
- ✅ Footer with club information

## Monitoring and Maintenance

### Weekly Checks
1. Check Resend dashboard for delivery rates
2. Monitor bounce rates (should be <5%)
3. Check complaint rates (should be <0.1%)

### Monthly Checks
1. Review email volume vs. limit
2. Check spam scores
3. Verify domain is still verified
4. Review athlete feedback on emails

### Update Email FROM Name (Optional)

If you want emails to show a friendly name like "SV Esting Turnverein":

1. Update `EMAIL_FROM` to: `"SV Esting Turnverein" <noreply@turnen.svesting.de>`
2. Redeploy application

This will show as:
- **From**: SV Esting Turnverein
- **Email**: noreply@turnen.svesting.de

## Security Best Practices

1. ✅ Never commit `RESEND_API_KEY` to Git
2. ✅ Use environment variables for all sensitive data
3. ✅ Rotate API keys periodically (every 6-12 months)
4. ✅ Monitor Resend dashboard for suspicious activity
5. ✅ Set up webhook alerts for bounces/complaints

## Support and Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend Status**: https://status.resend.com
- **DNS Checker**: https://mxtoolbox.com
- **Email Testing**: https://www.mail-tester.com

## Next Steps After Setup

1. ✅ Configure all environment variables in Vercel
2. ✅ Redeploy your application
3. ✅ Run through the testing checklist
4. ✅ Monitor first few emails in Resend dashboard
5. ✅ Inform trainers that email system is active
6. ✅ Train trainers on email features

## Production Go-Live Checklist

- [ ] Domain verified in Resend
- [ ] DNS records configured and propagated
- [ ] `RESEND_API_KEY` added to Vercel
- [ ] `EMAIL_FROM` set to `noreply@turnen.svesting.de`
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] Application redeployed
- [ ] All 4 email types tested in production
- [ ] Emails landing in inbox (not spam)
- [ ] Trainer account tested approval flow
- [ ] Training plan upload tested
- [ ] Absence alert tested
- [ ] Monitoring set up in Resend dashboard

## Quick Commands Reference

### Redeploy via Vercel CLI (Optional)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Redeploy to production
vercel --prod
```

### Check Environment Variables
```bash
# List all env vars (must be logged in)
vercel env ls
```

### Add Environment Variable via CLI
```bash
vercel env add RESEND_API_KEY
# Follow prompts to add value and select environments
```

---

**Ready to go live?** Follow the checklist above and your email system will be production-ready! 🚀
