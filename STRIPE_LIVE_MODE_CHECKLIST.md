# 🔴 Stripe Live Mode Switch - Checklist

## ⚠️ CRITICAL: Read Before Switching to Live Mode

### Pre-Flight Checklist

- [ ] **Business Verified:** Stripe account fully activated with business details
- [ ] **Bank Account Connected:** Payout account configured
- [ ] **Test Mode Thoroughly Tested:** All payment flows work in test mode
- [ ] **Error Handling Tested:** Failed payments handled gracefully
- [ ] **Webhook Tested:** Subscriptions and payments trigger correct webhooks

---

## 🔐 Environment Variables to Update

### DigitalOcean Backend Environment Variables:

```bash
# OLD (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from test webhook)

# NEW (Live Mode)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

---

## 📋 Step-by-Step Process

### Step 1: Get Live Keys from Stripe

1. Go to: https://dashboard.stripe.com/
2. Toggle to **Live Mode** (top-right)
3. Navigate to: **Developers** → **API Keys**
4. Copy:
   - Secret key (sk_live_...)
   - Publishable key (pk_live_...)

### Step 2: Configure Live Webhook

1. Stripe Dashboard → **Developers** → **Webhooks** (Live Mode)
2. Click **"Add endpoint"**
3. Endpoint URL: `https://urchin-app-uzvhp.ondigitalocean.app/api/subscription/webhook`
4. Select events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`
5. Save and copy the **Signing secret** (whsec_...)

### Step 3: Update DigitalOcean Environment

1. Go to: https://cloud.digitalocean.com/apps
2. Select your app
3. Settings → Environment Variables
4. Update the three Stripe variables (see above)
5. Save and **Redeploy**
6. Wait 3-5 minutes for deployment

### Step 4: Test Live Mode (Carefully!)

⚠️ **Use real cards carefully - you will be charged!**

**Option A: Use your own card for $1 test**
- Make a $1 purchase
- Verify payment goes through
- Check Stripe dashboard for the transaction
- Issue refund immediately

**Option B: Ask a trusted friend/colleague**
- Have them test with their card
- Refund immediately

### Step 5: Monitor for 24 Hours

After going live:
- ✅ Check Stripe dashboard every few hours
- ✅ Monitor backend logs for errors
- ✅ Test signup and subscription flow
- ✅ Verify webhooks are firing correctly
- ✅ Check that subscriptions are recorded in Firebase

---

## 🚨 Important Warnings

### ⚠️ BEFORE GOING LIVE:

1. **Real Money:** Live mode charges real credit cards
2. **Refund Policy:** Have a clear refund policy
3. **Customer Support:** Be ready to handle payment issues
4. **Monitoring:** Set up alerts for failed payments
5. **Terms of Service:** Update your ToS to mention payments
6. **Privacy Policy:** Update privacy policy for payment data

### 🛡️ Security Checklist:

- [ ] Live secret key is ONLY in backend environment variables
- [ ] Never commit live keys to Git
- [ ] Webhook secret is set correctly
- [ ] HTTPS is enforced on all endpoints
- [ ] Backend validates webhook signatures

---

## 💰 Pricing to Configure in Your App

### Current Pricing (Update if needed):

**One-Time Downloads:**
- $1.00 per PDF download (with watermark removed)

**Subscription:**
- $9.99/month for 60 downloads
- Auto-renews monthly
- Cancel anytime

### Update Stripe Products:

1. Stripe Dashboard → **Products**
2. Create/Update products with **live mode** pricing
3. Copy the **Price ID** (price_...)
4. Update backend code if needed (check subscriptionRoutes.js)

---

## 🧪 Testing After Going Live

### Test 1: One-Time Payment
```
1. Upload a COA
2. Try to download (free with watermark should work)
3. Try paid download ($1.00)
4. Verify charge appears in Stripe
5. Verify download works without watermark
```

### Test 2: Subscription
```
1. Click "Upgrade to Pro"
2. Complete checkout ($9.99/month)
3. Verify subscription appears in Stripe
4. Verify user can download without paying per-file
5. Test monthly billing (wait or use Stripe's test clock)
```

### Test 3: Webhook Verification
```
1. Stripe Dashboard → Webhooks → Your endpoint
2. Click "Send test webhook"
3. Check backend logs for webhook receipt
4. Verify data is saved to Firebase
```

---

## 🔄 Rollback Plan (If Something Goes Wrong)

If issues occur after going live:

### Quick Rollback to Test Mode:

1. **DigitalOcean:**
   - Change environment variables back to test keys
   - Redeploy backend

2. **Stripe:**
   - No changes needed (test mode still works)

3. **Notify Users:**
   - Add banner: "Payment system temporarily unavailable"

### Emergency Contact:
- Stripe Support: https://support.stripe.com/
- Email: support@stripe.com

---

## 📊 Monitoring After Going Live

### Stripe Dashboard Metrics to Watch:

1. **Payments → Overview:**
   - Total volume
   - Success rate
   - Failed payments

2. **Billing → Subscriptions:**
   - Active subscriptions
   - Churn rate
   - MRR (Monthly Recurring Revenue)

3. **Developers → Webhooks:**
   - Success rate
   - Failed webhook attempts

### Set Up Alerts:

1. **Stripe Dashboard → Settings → Notifications**
2. Enable email alerts for:
   - ✅ Failed payments
   - ✅ Disputed charges
   - ✅ Webhook failures
   - ✅ High volume activity

---

## 📝 Post-Launch Checklist (First Week)

Day 1:
- [ ] Monitor every 2 hours
- [ ] Test complete user flow
- [ ] Check webhook delivery

Day 2-7:
- [ ] Check daily for failed payments
- [ ] Review customer feedback
- [ ] Monitor subscription cancellations
- [ ] Verify payouts are working

Month 1:
- [ ] Review total revenue
- [ ] Check for any disputes/chargebacks
- [ ] Optimize pricing if needed
- [ ] Review customer retention

---

## 🆘 Common Issues & Solutions

### Issue 1: Webhook Not Receiving Events
**Solution:**
- Check webhook URL is correct
- Verify endpoint is publicly accessible
- Check backend logs for errors
- Test with Stripe CLI: `stripe listen --forward-to localhost:5001/api/subscription/webhook`

### Issue 2: Payments Failing
**Solution:**
- Check Stripe dashboard for decline reason
- Verify publishable key is live version
- Check backend logs for errors
- Test with different card

### Issue 3: Subscriptions Not Recording
**Solution:**
- Verify webhook secret is correct
- Check Firebase rules allow writes
- Review backend subscription logic
- Check Firestore for subscription records

---

## ✅ Final Verification

Before announcing live mode to users:

```bash
# Test these scenarios:

1. ✅ New user signup
2. ✅ Upload and process PDF
3. ✅ Free download (with watermark)
4. ✅ Paid download ($1.00)
5. ✅ Subscribe to Pro ($9.99/month)
6. ✅ Use Pro downloads (no per-file charge)
7. ✅ Cancel subscription
8. ✅ Verify refunds work
9. ✅ Test webhook delivery
10. ✅ Check Firebase records
```

---

## 📞 Support Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com/
- **Test Cards:** https://stripe.com/docs/testing
- **Webhook Testing:** https://stripe.com/docs/webhooks/test

---

**Last Updated:** December 31, 2025
**Status:** Ready for Live Mode Switch
**Risk Level:** 🔴 HIGH (Real money involved)

**Remember: Test thoroughly before going live!**

