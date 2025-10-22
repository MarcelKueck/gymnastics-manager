# Email System Setup Guide

## Step 1: Get Resend API Key

1. Go to [resend.com](https://resend.com) and create a free account
2. Verify your email address
3. Navigate to "API Keys" in the dashboard
4. Click "Create API Key"
5. Give it a name (e.g., "Gymnastics Portal")
6. Copy the API key (it will only be shown once!)

## Step 2: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Existing variables
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# NEW: Email Configuration
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

**Important Notes:**
- Replace `re_xxxxxxxxxxxxxxxxxxxxx` with your actual Resend API key
- For development, you can use any email address for `EMAIL_FROM`
- For production, you'll need to verify your domain in Resend

## Step 3: Test Email System

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Log in as a trainer:
   - Email: `trainer@gym.com`
   - Password: `trainer123`

3. Navigate to: `http://localhost:3000/trainer/test-email`

4. Enter your personal email address in the test field

5. Click each button to test all 4 email types:
   - Athlet freigeschaltet
   - Trainingsplan geändert
   - Trainingsplan hochgeladen
   - Fehlzeiten-Alert

6. Check your inbox for the test emails!

## Step 4: Verify Email Integration

### Test Approval Email
1. Register a new athlete account
2. Log in as trainer
3. Go to "Ausstehende Freischaltungen"
4. Approve the athlete and configure training
5. Check the athlete's email inbox

### Test Schedule Change Email
1. Log in as trainer
2. Go to "Athleten" > Select an athlete
3. Click "Konfiguration bearbeiten"
4. Change training days, hours, or group
5. Save changes
6. Check the athlete's email inbox

### Test Training Plan Email
1. Log in as trainer
2. Go to "Trainingspläne"
3. Upload a new PDF training plan
4. ALL approved athletes should receive an email

### Test Absence Alert
1. Log in as trainer
2. Go to "Trainingseinheiten"
3. Mark an athlete as "Unentschuldigt" for 3+ sessions
4. On the 3rd unexcused absence, emails are sent to:
   - The trainer (always)
   - The athlete + guardian (if configured)

## Troubleshooting

### "Error: Missing API key"
- Make sure `RESEND_API_KEY` is in your `.env` file
- Restart your development server after adding environment variables

### Emails not sending
- Check the server console for error messages
- Verify your Resend API key is correct
- Check your Resend dashboard for delivery status
- In development, check your spam folder

### "Invalid sender email"
- Resend requires sender verification for production
- In development, any email works
- For production, add and verify your domain in Resend

## Production Deployment

Before deploying to production:

1. **Verify Your Domain in Resend:**
   - Add your domain in Resend dashboard
   - Add the required DNS records (SPF, DKIM)
   - Wait for verification (usually a few minutes)

2. **Update EMAIL_FROM:**
   ```env
   EMAIL_FROM="noreply@youractualdomain.com"
   ```

3. **Test in Production:**
   - Use the test email page
   - Verify deliverability
   - Check spam scores

## Email Delivery Best Practices

1. **Don't Spam:** Emails are only sent when necessary
2. **Unsubscribe Link:** Add in future update
3. **Monitor Deliverability:** Check Resend dashboard regularly
4. **Respect Bounces:** Resend automatically handles bounces

## Email Templates

All emails are in German and include:
- Professional branding with club color (#509f28)
- Mobile-responsive design
- Clear call-to-action buttons
- Contact information
- Automatic generation notice

## Cost Estimate

Resend Free Tier:
- 3,000 emails/month
- Perfect for small to medium clubs
- Monitor usage in Resend dashboard

For larger clubs:
- Upgrade to paid plan as needed
- Very affordable pricing

## Support

If you encounter issues:
1. Check server console logs
2. Check Resend dashboard
3. Verify environment variables
4. Test with the `/trainer/test-email` page