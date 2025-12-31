# 🚀 Stripe Production Setup - Complete Guide

## ✅ Code Updated Successfully!

Your backend now uses Stripe Price ID (production best practice).

---

## 📋 **COMPLETE CHECKLIST**

### ☑️ **STEP 1: Create Stripe Product (Do This First)**

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/products
   - ⚠️ **CRITICAL:** Toggle to **"Live mode"** (top-right corner)

2. **Click "Add product"**

3. **Fill in Product Details:**
   ```
   Product information:
   ┌─────────────────────────────────────────────────┐
   │ Name: COA Processor Pro                         │
   │                                                  │
   │ Description:                                     │
   │ 60 watermark-free COA downloads per month       │
   │                                                  │
   │ ✅ Recurring product                            │
   └─────────────────────────────────────────────────┘

   Pricing information:
   ┌─────────────────────────────────────────────────┐
   │ Standard pricing                                 │
   │                                                  │
   │ Price: $39.00 USD                               │
   │ Billing period: Monthly                         │
   │ Currency: USD                                   │
   └─────────────────────────────────────────────────┘
   ```

4. **Click "Save product"**

5. **Copy the Price ID:**
   - After saving, you'll see your product
   - Under **Pricing**, you'll see an API ID like:
     ```
     price_1QZjXxSHc8f3gXYZ...
     ```
   - **📋 COPY THIS ENTIRE ID** - You'll need it in the next step!

---

### ☑️ **STEP 2: Update DigitalOcean Environment Variables**

1. **Go to DigitalOcean:**
   - Visit: https://cloud.digitalocean.com/apps
   - Select your app

2. **Navigate to Environment Variables:**
   - Click: **Settings** → **Environment Variables**

3. **Add/Update These 4 Variables:**

   ```bash
   # Stripe Live Keys (from Step 1 of main guide)
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   
   # NEW: Add Stripe Price ID (from Product you just created)
   STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
   ```

4. **Save and Redeploy:**
   - Click **"Save"**
   - Click **"Redeploy"** or **"Save & Deploy"**
   - Wait 3-5 minutes for deployment

---

### ☑️ **STEP 3: Set Up Live Webhook**

1. **Go to Stripe Webhooks:**
   - Stripe Dashboard → **Developers** → **Webhooks**
   - ⚠️ Make sure you're in **Live mode**

2. **Click "Add endpoint"**

3. **Configure Webhook:**
   ```
   Endpoint URL:
   https://urchin-app-uzvhp.ondigitalocean.app/api/subscription/webhook
   
   Description: Production subscription webhooks
   
   Events to send:
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ checkout.session.completed
   ```

4. **Save and Copy Signing Secret:**
   - Click **"Add endpoint"**
   - Click **"Reveal"** next to **Signing secret**
   - Copy the `whsec_...` value

5. **Update Webhook Secret in DigitalOcean:**
   - Go back to Environment Variables
   - Update: `STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET`
   - Save and Redeploy

---

### ☑️ **STEP 4: Verify Stripe Business Info**

Before accepting live payments, complete:

1. **Business Details:**
   - Stripe Dashboard → **Settings** → **Business settings**
   - Company name
   - Business address
   - Tax ID (if applicable)

2. **Bank Account:**
   - **Settings** → **Payouts**
   - Add bank account for receiving payments

3. **Verify Identity:**
   - Upload any requested documents
   - Complete identity verification if prompted

---

### ☑️ **STEP 5: Deploy Updated Backend Code**

The code has been updated locally. Now deploy it:

```bash
cd /Users/sauravshaw/coa-pdf-processor

# Stage the changes
git add backend/src/routes/subscriptionRoutes.js

# Commit
git commit -m "Use Stripe Price ID for production subscriptions"

# Push to trigger auto-deployment
git push origin main
```

Wait 3-5 minutes for DigitalOcean to redeploy.

---

### ☑️ **STEP 6: Test in Live Mode**

⚠️ **WARNING: This will charge real money!**

**Test with small amount first:**

1. **Create Test Account:**
   - Visit: https://coaprocessor.com
   - Sign up with a test email (e.g., `test@yourdomain.com`)

2. **Test Subscription Flow:**
   - Click "Upgrade to Pro"
   - Should see **"COA Processor Pro - $39.00/month"**
   - Use your own card (you'll be charged)
   - Complete checkout

3. **Verify in Stripe Dashboard:**
   - Go to: **Payments** → **All payments**
   - Should see $39.00 charge
   - Go to: **Billing** → **Subscriptions**
   - Should see active subscription

4. **Test in App:**
   - User should show as "Pro" subscriber
   - Should have 60 downloads available
   - Test PDF processing and download
   - Should work without watermark

5. **Immediately Cancel & Refund:**
   - Stripe Dashboard → Find the customer
   - Cancel subscription
   - Issue full refund

---

## 🧪 **Complete Testing Checklist**

### Test Subscription Flow:
```
☐ User can click "Upgrade to Pro"
☐ Stripe checkout shows "$39.00/month"
☐ Payment goes through
☐ User account shows "Pro" status
☐ User has 60 downloads available
☐ Downloads work without watermark
☐ Webhook fires and updates database
```

### Test Webhook Events:
```
☐ Subscription created → User activated
☐ Invoice paid → Downloads renewed
☐ Subscription canceled → User downgraded
☐ Payment failed → User notified
```

### Test Customer Portal:
```
☐ User can access billing portal
☐ User can update payment method
☐ User can cancel subscription
☐ User can view invoices
```

---

## 📊 **What Changed in the Code**

### Old Approach (Dynamic Price):
```javascript
price_data: {
  currency: 'usd',
  product_data: {
    name: 'COA Processor Pro',
    description: '60 watermark-free downloads per month',
  },
  unit_amount: 3900,
  recurring: { interval: 'month' },
}
```

### New Approach (Price ID):
```javascript
price: process.env.STRIPE_PRICE_ID,
quantity: 1,
```

**Benefits:**
✅ Single product in Stripe dashboard
✅ Easier to manage pricing
✅ Better customer portal experience
✅ Professional production setup
✅ Can change price in Stripe without code changes

---

## 🔒 **Security Checklist**

Before going live:

```
☐ STRIPE_SECRET_KEY is only in backend environment (never in Git)
☐ STRIPE_PRICE_ID is in backend environment
☐ Webhook secret is configured correctly
☐ HTTPS is enforced on all endpoints
☐ Backend validates webhook signatures
☐ Firebase security rules are deployed
☐ CORS is configured for production domain
```

---

## 📈 **Post-Launch Monitoring**

### First 24 Hours:
- ✅ Check Stripe Dashboard every 2 hours
- ✅ Monitor webhook delivery (should be 100% success)
- ✅ Watch for failed payments
- ✅ Verify subscriptions are recording correctly
- ✅ Check Firebase for subscription data

### First Week:
- ✅ Review all transactions daily
- ✅ Check for any disputes/chargebacks
- ✅ Monitor subscription cancellations
- ✅ Track revenue vs. projections
- ✅ Verify payouts are scheduled correctly

### Set Up Alerts:
1. Stripe Dashboard → **Settings** → **Notifications**
2. Enable alerts for:
   - Failed payments
   - Disputed charges
   - Webhook failures
   - Unusual activity

---

## 🆘 **Troubleshooting**

### Issue: "Subscription pricing not configured"
**Cause:** STRIPE_PRICE_ID environment variable not set
**Fix:** 
1. Check DigitalOcean environment variables
2. Add STRIPE_PRICE_ID with your Price ID
3. Redeploy

### Issue: Checkout shows wrong price
**Cause:** Using test Price ID in live mode (or vice versa)
**Fix:**
1. Verify you're in Live mode in Stripe
2. Copy the LIVE Price ID
3. Update environment variable
4. Redeploy

### Issue: Webhook not receiving events
**Cause:** Webhook URL incorrect or signing secret mismatch
**Fix:**
1. Verify webhook URL is correct
2. Ensure webhook is in Live mode
3. Copy new signing secret
4. Update STRIPE_WEBHOOK_SECRET
5. Redeploy

### Issue: Payment succeeds but user not activated
**Cause:** Webhook not processing or Firebase update failing
**Fix:**
1. Check backend logs for errors
2. Verify webhook signature is correct
3. Check Firebase security rules
4. Manually activate user in Firebase if needed

---

## 💰 **Pricing Summary**

Your current configuration:

```
Product: COA Processor Pro
Price: $39.00/month
Includes: 60 watermark-free downloads
Billing: Automatic monthly renewal
Cancellation: User can cancel anytime
```

**Stripe Fees:**
- 2.9% + $0.30 per transaction
- $39.00 subscription = $1.44 fee
- You receive: $37.56 per subscription

---

## 📞 **Support Resources**

- **Stripe Documentation:** https://stripe.com/docs/billing/subscriptions
- **Stripe Support:** https://support.stripe.com/
- **Price ID Guide:** https://stripe.com/docs/billing/prices-guide
- **Webhook Testing:** https://stripe.com/docs/webhooks/test

---

## ✅ **Final Verification**

Before announcing to users:

```bash
# Backend
☐ Code deployed with Price ID changes
☐ Environment variables set in DigitalOcean
☐ Backend redeployed successfully

# Stripe
☐ Product created in Live mode
☐ Price set to $39/month
☐ Webhook configured for live endpoint
☐ Business info completed
☐ Bank account connected

# Testing
☐ Test subscription created successfully
☐ User activated in app
☐ Downloads work correctly
☐ Webhook events firing
☐ Firebase updating correctly

# Monitoring
☐ Stripe alerts configured
☐ Billing limits set
☐ Ready to monitor transactions
```

---

## 🎉 **You're Ready!**

Once all checkboxes above are complete, your Stripe integration is production-ready!

**Next Steps:**
1. Complete STEP 1-6 above
2. Test with your own card
3. Cancel and refund test subscription
4. Monitor first real customers closely
5. Celebrate your launch! 🚀

---

**Last Updated:** December 31, 2025
**Stripe Mode:** Live Production
**Status:** Ready for Deployment


