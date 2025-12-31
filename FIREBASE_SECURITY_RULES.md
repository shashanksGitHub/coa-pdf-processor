# Firebase Security Rules Configuration

## 🔐 Firestore Security Rules

Copy these rules to Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && 
        request.auth.token.email == 'admin@coaprocessor.com';
    }
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isSignedIn();
      allow update: if isOwner(userId);
      allow delete: if isAdmin();
    }
    
    // Company information - users can only access their own company data
    match /companies/{userId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }
    
    // Reviews - authenticated users can create, users can read their own
    match /reviews/{reviewId} {
      allow create: if isSignedIn();
      allow read: if isAdmin() || 
        (isSignedIn() && resource.data.userId == request.auth.uid);
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Subscriptions - users can read their own, only backend/admin can write
    match /subscriptions/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if false; // Only backend service account should write
    }
    
    // Transactions/Payments - users can read their own
    match /transactions/{transactionId} {
      allow read: if isSignedIn() && 
        resource.data.userId == request.auth.uid;
      allow write: if false; // Only backend
    }
    
    // Admin collection - only for admin access
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }
    
    // PDF Processing Logs (optional) - users can read their own
    match /pdfLogs/{logId} {
      allow create: if isSignedIn();
      allow read: if isSignedIn() && 
        resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

## 🗄️ Firebase Storage Rules

Copy these rules to Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Validate file size (max 50MB for PDFs)
    function isValidFileSize() {
      return request.resource.size < 50 * 1024 * 1024;
    }
    
    // Validate PDF file type
    function isPDF() {
      return request.resource.contentType == 'application/pdf';
    }
    
    // Validate image file type
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // User uploaded PDFs - private to each user
    match /users/{userId}/uploads/{fileName} {
      allow read, write: if isOwner(userId) && isValidFileSize() && isPDF();
    }
    
    // Generated COA PDFs - private to each user
    match /users/{userId}/generated/{fileName} {
      allow read: if isOwner(userId);
      allow write: if false; // Only backend can write
    }
    
    // Company logos - users can upload their own, public read
    match /company-logos/{userId}/{fileName} {
      allow read: if true; // Public read for displaying logos
      allow write: if isOwner(userId) && 
        isValidFileSize() && 
        isImage() &&
        request.resource.size < 5 * 1024 * 1024; // Max 5MB for logos
    }
    
    // Admin uploads
    match /admin/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email == 'admin@coaprocessor.com';
    }
    
    // Temporary files - 1 hour expiry
    match /temp/{userId}/{fileName} {
      allow read, write: if isOwner(userId) && isValidFileSize();
      // Note: Set up Cloud Function to delete files older than 1 hour
    }
  }
}
```

## 🔧 How to Deploy These Rules

### Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **coa-pdf-processor**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy and paste the Firestore rules above
5. Click **Publish**

### Storage Rules

1. In Firebase Console
2. Navigate to **Storage** → **Rules** tab
3. Copy and paste the Storage rules above
4. Click **Publish**

## 🧪 Testing Rules

### Firestore Rules Testing

In Firebase Console → Firestore → Rules → Simulate:

```javascript
// Test 1: User can read their own data
Auth: Authenticated user with UID: test-user-123
Location: /users/test-user-123
Operation: get
Expected: Allow ✅

// Test 2: User cannot read other user's data
Auth: Authenticated user with UID: test-user-123
Location: /users/another-user-456
Operation: get
Expected: Deny ❌

// Test 3: Unauthenticated cannot access
Auth: Unauthenticated
Location: /users/test-user-123
Operation: get
Expected: Deny ❌
```

## 🛡️ Security Best Practices

### 1. **Never trust client-side validation**
All security rules must be enforced server-side (Firebase rules + backend validation)

### 2. **Principle of least privilege**
Grant minimum necessary permissions

### 3. **Regular audits**
Review Firebase Console → Authentication → Users regularly
Check for suspicious activity

### 4. **Rate limiting**
Implemented in backend server.js with express-rate-limit

### 5. **Admin email verification**
Update admin email in rules when you have your production admin account:
```javascript
function isAdmin() {
  return isSignedIn() && 
    request.auth.token.email == 'your-actual-admin@coaprocessor.com';
}
```

## 📊 Monitoring

### Firebase Console

Monitor in real-time:
- **Authentication** → Usage tab
- **Firestore** → Usage tab
- **Storage** → Usage tab
- Check for unusual spikes

### Set Up Alerts

1. Firebase Console → Project Settings → Integrations
2. Enable Cloud Monitoring
3. Set up alerts for:
   - Unusual read/write operations
   - Storage quota approaching limit
   - Authentication failures

## 🚨 Common Security Issues to Avoid

### ❌ DON'T DO THIS:
```javascript
// Allowing all reads/writes
match /{document=**} {
  allow read, write: if true;
}
```

### ✅ DO THIS:
```javascript
// Specific rules with authentication checks
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

## 📝 Additional Recommendations

### 1. **Enable App Check** (Optional but recommended)
Protects against abuse and unauthorized access

Firebase Console → App Check → Register app

### 2. **Enable Firebase Security Rules Logging**
```bash
gcloud logging read "resource.type=firebase_rules" --limit 50
```

### 3. **Backup Strategy**
Regular Firestore exports:
```bash
gcloud firestore export gs://[BUCKET_NAME]
```

### 4. **Review User Permissions**
Monthly review of:
- Active users
- Admin access
- API keys and service accounts

---

**Last Updated:** December 30, 2025
**Project:** COA PDF Processor
**Security Level:** Production-Ready 🔒


