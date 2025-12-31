# 🎟️ Stripe Promotion Codes Guide

## ✅ Coupon Field Enabled!

Your checkout now has a "Apply Coupon" field where customers can enter promo codes.

---

## 📋 How to Create Promotion Codes in Stripe

### **Step 1: Create a Coupon**

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/coupons
   - ⚠️ Make sure you're in **Live mode** (toggle top-right)

2. **Click "Create coupon"**

3. **Choose Coupon Type:**

   **Option A: Percentage Off**
   ```
   Type: Percentage discount
   Percentage: 20% (or any amount)
   Duration: 
     - Forever (discount applies forever)
     - Once (first payment only)
     - Repeating (e.g., 3 months)
   
   Name: 20% Off Forever
   ID: 20OFF (optional, auto-generated if blank)
   ```

   **Option B: Fixed Amount Off**
   ```
   Type: Fixed amount discount
   Amount: $10.00 USD
   Duration: Forever / Once / Repeating
   
   Name: $10 Off
   ID: 10DOLLARS
   ```

4. **Click "Create coupon"**

---

### **Step 2: Create a Promotion Code**

After creating the coupon:

1. **In the Coupon details page:**
   - Click **"Create promotion code"**

2. **Configure Promotion Code:**
   ```
   Promotion code: LAUNCH2025
   (This is what customers type at checkout)
   
   Coupon: [Select the coupon you just created]
   
   Active: ✅ (enabled)
   
   Optional settings:
   ├─ Expiration date: Set if you want it to expire
   ├─ Max redemptions: Limit total uses
   └─ First-time customers only: Restrict to new customers
   ```

3. **Click "Create promotion code"**

4. **Share the code:** `LAUNCH2025` with your customers!

---

## 🎯 **Common Promotion Code Examples**

### **1. Launch Special (20% off forever)**
```
Coupon:
  Type: Percentage
  Amount: 20%
  Duration: Forever

Promotion Code: LAUNCH20
Use case: Early adopter discount
```

### **2. First Month Free**
```
Coupon:
  Type: Percentage
  Amount: 100%
  Duration: Once (first payment only)

Promotion Code: FIRSTFREE
Use case: Trial incentive
```

### **3. $10 Off First 3 Months**
```
Coupon:
  Type: Fixed amount
  Amount: $10.00
  Duration: Repeating (3 months)

Promotion Code: SAVE10
Use case: New customer incentive
```

### **4. Holiday Special (25% off 6 months)**
```
Coupon:
  Type: Percentage
  Amount: 25%
  Duration: Repeating (6 months)

Promotion Code: HOLIDAY25
Expiration: Dec 31, 2025
Use case: Seasonal promotion
```

### **5. Referral Discount**
```
Coupon:
  Type: Fixed amount
  Amount: $5.00
  Duration: Forever

Promotion Code: FRIEND5
Use case: Word-of-mouth marketing
```

---

## 💡 **Best Practices**

### **Code Naming:**
- ✅ Short and memorable: `LAUNCH20`, `SAVE10`
- ✅ Self-explanatory: `FIRSTFREE`, `HOLIDAY25`
- ❌ Avoid: Long codes, confusing combinations

### **Discount Strategy:**

**For New Customers:**
- First month free (100% off once)
- 20-30% off first 3 months
- Fixed $10-15 off

**For Marketing Campaigns:**
- Limited-time codes (set expiration)
- Influencer codes (track usage per code)
- Social media exclusive codes

**For Retention:**
- Win-back codes for canceled users
- Loyalty codes for long-term users
- Referral rewards

---

## 🔧 **How It Works in Your App**

### **Customer Experience:**

1. User clicks **"Upgrade to Pro"**
2. Stripe Checkout opens
3. **"Add promotion code"** link appears
4. User clicks it
5. Input field appears
6. User enters code: `LAUNCH20`
7. Discount applies automatically
8. Price updates: ~~$39.00~~ → **$31.20/month**
9. User completes payment

### **Backend Handling:**

- ✅ Stripe automatically applies discount
- ✅ Webhooks receive correct discounted amount
- ✅ Customer is charged discounted price
- ✅ Discount shows in Stripe dashboard
- ✅ Invoices reflect the discount

**No code changes needed!** It's all automatic. ✨

---

## 📊 **Tracking Promo Code Usage**

### **In Stripe Dashboard:**

1. **Go to:** Stripe Dashboard → **Product catalog** → **Promotion codes**
2. **View metrics:**
   - Times redeemed
   - Total discount given
   - Revenue impact

3. **Individual code details:**
   - Click on any code
   - See: Usage over time
   - See: Customer list who used it

---

## 🎨 **Marketing Ideas**

### **Launch Promotion:**
```
Code: LAUNCH2025
Discount: 30% off first 3 months
Message: "Launch special! Use code LAUNCH2025 for 30% off"
```

### **Social Media:**
```
Code: TWITTER20
Discount: 20% off forever
Message: "Twitter exclusive! Use TWITTER20 for 20% off"
```

### **Email Campaign:**
```
Code: EMAIL10
Discount: $10 off first month
Message: "Special offer for our subscribers"
```

### **Influencer Partnership:**
```
Code: INFLUENCER25
Discount: 25% off first month
Track: Who's driving conversions
```

---

## 🚨 **Important Notes**

### **Test vs Live:**
- ⚠️ Promotion codes are separate in Test and Live mode
- Create codes in **Live mode** for production
- Create codes in **Test mode** for testing

### **Security:**
- Codes are case-insensitive (`LAUNCH20` = `launch20`)
- Can't be reused after max redemptions reached
- Expire automatically if expiration date set

### **Limitations:**
- Can only apply one promo code per checkout
- Can't combine multiple codes
- Some payment methods may not support promo codes

---

## ✅ **Testing Your Promo Codes**

### **Before Going Live:**

1. **Create Test Promo Code:**
   - Switch to Test mode in Stripe
   - Create a test coupon and promo code
   - Test code: `TESTDISCOUNT`

2. **Test Checkout Flow:**
   - Visit your app (test environment)
   - Click "Upgrade to Pro"
   - Enter test promo code
   - Verify discount applies
   - Use test card: `4242 4242 4242 4242`

3. **Verify in Stripe:**
   - Check Test mode dashboard
   - See if discount was applied correctly
   - Verify subscription shows discounted price

### **After Going Live:**

Repeat with Live promo codes and real payment.

---

## 📈 **Suggested Launch Strategy**

### **Week 1: Aggressive Discount**
```
Code: EARLYBIRD
Discount: 50% off first month
Goal: Get initial users
```

### **Month 1: Standard Discount**
```
Code: LAUNCH20
Discount: 20% off first 3 months
Goal: Build user base
```

### **Ongoing: Moderate Discount**
```
Code: SAVE10
Discount: $10 off
Goal: Steady conversions
```

### **Special Events:**
```
Codes: BLACKFRIDAY, NEWYEAR, etc.
Discount: 25-40% off
Goal: Seasonal boost
```

---

## 🎯 **Quick Reference**

### Create Your First Promo Code:

1. Stripe Dashboard → **Coupons** (Live mode)
2. Create coupon: **20% off forever**
3. Create promo code: **LAUNCH20**
4. Share with users!
5. They enter it at checkout ✅

### The code is already enabled in your app!

Just create promotion codes in Stripe and customers can use them immediately. 🎉

---

## 📞 **Resources**

- **Stripe Coupons Docs:** https://stripe.com/docs/billing/subscriptions/coupons
- **Promotion Codes:** https://stripe.com/docs/billing/subscriptions/coupons/codes
- **Checkout with Promo:** https://stripe.com/docs/payments/checkout/discount-codes

---

**Status:** ✅ Promo codes enabled in checkout
**Next Step:** Create your first promotion code in Stripe!
**Marketing:** Share codes with your audience 🚀


