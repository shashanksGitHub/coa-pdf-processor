# Stripe Payment Integration Guide

This guide explains how to set up Stripe payment integration for the COA PDF Processor.

## 🎯 Payment Flow

1. User uploads PDF and backend processes it
2. User clicks "Pay $1 & Download" button
3. Payment modal opens with Stripe checkout
4. User enters payment details
5. After successful payment, PDF is downloaded automatically

## 🔐 Stripe API Keys

You have two types of API keys:

### Test Keys (for development)
- **Publishable Key:** `pk_test_YOUR_PUBLISHABLE_KEY`
- **Secret Key:** `sk_test_YOUR_SECRET_KEY`

Get your keys from: https://dashboard.stripe.com/test/apikeys

### Production Keys
- Get these from your Stripe Dashboard when ready to go live
- **NEVER** commit production keys to Git

## 🔧 Backend Configuration

### 1. Update Backend Environment Variables

Add to `/backend/.env`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

### 2. DigitalOcean Environment Variables

Go to your DigitalOcean App → Settings → App-Level Environment Variables:

Add these variables:
```
STRIPE_SECRET_KEY = sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY = pk_test_YOUR_PUBLISHABLE_KEY
```

## 💻 Frontend Configuration

The frontend automatically fetches the Stripe publishable key from the backend API (`/api/payment/config`), so no additional configuration is needed!

However, if you want to hardcode it (not recommended):

```env
# /frontend/.env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

## 📝 New API Endpoints

### 1. Create Payment Intent
```http
POST /api/payment/create-payment-intent
Content-Type: application/json

{
  "filename": "COA_ProductName_123456.pdf",
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### 2. Verify Payment
```http
POST /api/payment/verify-payment
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "paid": true,
  "filename": "COA_ProductName_123456.pdf",
  "amount": 100
}
```

### 3. Get Stripe Config
```http
GET /api/payment/config
```

**Response:**
```json
{
  "success": true,
  "publishableKey": "pk_test_..."
}
```

## 🧪 Testing with Test Cards

Use these test card numbers in development:

### Successful Payment
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

### Declined Payment
- **Card Number:** `4000 0000 0000 0002`
- **Result:** Generic decline

### Requires Authentication
- **Card Number:** `4000 0027 6000 3184`
- **Result:** Requires 3D Secure authentication

More test cards: https://stripe.com/docs/testing

## 🚀 Deployment Steps

### 1. Local Testing

```bash
# Start backend (in /backend directory)
npm start

# Start frontend (in /frontend directory)
npm run dev
```

Visit http://localhost:5173 and test the payment flow.

### 2. Deploy to Production

#### Backend (DigitalOcean)

```bash
cd backend
git add .
git commit -m "Add Stripe payment integration"
git push origin main
```

DigitalOcean will auto-deploy. Make sure to add environment variables in the dashboard!

#### Frontend (Firebase)

```bash
cd frontend
npm run build
npm run deploy
```

## 💰 Pricing Configuration

The payment amount is set to **$1.00** (100 cents). To change it:

### Backend
Edit `/backend/src/routes/paymentRoutes.js`:
```javascript
const { filename, amount = 100 } = req.body; // Change 100 to desired amount in cents
```

### Frontend
Edit `/frontend/src/components/Dashboard/PaymentModal.jsx`:
```javascript
createPaymentIntent(filename, 100) // Change 100 to desired amount in cents
```

Also update the display text in:
- `/frontend/src/components/Dashboard/PDFPreview.jsx` - Button text
- `/frontend/src/components/Dashboard/PaymentModal.jsx` - Modal title and amount display

## 🔒 Security Best Practices

1. **Never expose secret keys** - Only use them in the backend
2. **Use environment variables** - Never hardcode keys
3. **Enable webhooks** - For production, set up Stripe webhooks to handle payment events
4. **Use HTTPS** - Always use HTTPS in production
5. **Validate on backend** - Always verify payment status on the backend before delivering content

## 📊 Monitoring Payments

### Stripe Dashboard
- View all payments: https://dashboard.stripe.com/payments
- Test mode toggle: Top right corner
- Logs: https://dashboard.stripe.com/logs

### In Your App
All payment attempts are logged in the backend console with:
- Payment intent creation
- Payment verification
- Any errors or failures

## 🎨 Customization

### Payment Modal Styling
Edit `/frontend/src/components/Dashboard/PaymentModal.jsx` to customize:
- Colors
- Layout
- Text
- Stripe Elements appearance

### Amount Display
The amount is shown in USD. To change currency:
1. Update backend `paymentRoutes.js` - Change `currency: 'usd'`
2. Update frontend display text

## 🐛 Troubleshooting

### "Stripe is not defined"
- Make sure Stripe dependencies are installed: `npm install`
- Check that `@stripe/stripe-js` and `@stripe/react-stripe-js` are in package.json

### "Invalid API Key"
- Verify `STRIPE_SECRET_KEY` is set in backend `.env`
- Check it starts with `sk_test_` for test mode or `sk_live_` for production
- Restart the backend server after changing .env

### CORS Error
- Ensure frontend domain is in the backend CORS allowed origins
- Check that the API URL in frontend `.env` is correct

### Payment Modal Doesn't Open
- Check browser console for errors
- Verify Stripe publishable key is being fetched correctly
- Ensure payment intent is created successfully (check network tab)

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)

## 🎉 Success!

Once configured, your payment flow is:
1. ✅ User uploads PDF
2. ✅ Backend processes with GPT-4
3. ✅ User clicks "Pay $1 & Download"
4. ✅ Stripe payment modal appears
5. ✅ User enters card details
6. ✅ Payment is processed
7. ✅ PDF downloads automatically

**You're charging for downloads! 💰**

