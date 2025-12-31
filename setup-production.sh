#!/bin/bash

# COA PDF Processor - Production Setup Script
# This script helps prepare your application for production deployment

set -e

echo "🚀 COA PDF Processor - Production Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Installing Backend Security Packages"
echo "--------------------------------------------"
cd backend

if ! grep -q "helmet" package.json; then
    print_info "Installing helmet and express-rate-limit..."
    npm install helmet express-rate-limit
    print_success "Security packages installed"
else
    print_success "Security packages already installed"
fi

cd ..

echo ""
echo "Step 2: Checking Frontend Configuration"
echo "---------------------------------------"
cd frontend

# Check if firebase config is using environment variables
if grep -q "import.meta.env.VITE_FIREBASE" src/config/firebase.js; then
    print_success "Firebase config is using environment variables"
else
    print_warning "Firebase config may need updating to use environment variables"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "Frontend .env file not found"
    echo ""
    read -p "Would you like to create a .env template? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > .env << 'EOF'
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC_RPyX9MzebcwKkVc5R7k7x3urCjyTpBU
VITE_FIREBASE_AUTH_DOMAIN=coa-pdf-processor.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=coa-pdf-processor
VITE_FIREBASE_STORAGE_BUCKET=coa-pdf-processor.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=813892924411
VITE_FIREBASE_APP_ID=1:813892924411:web:318a2cfd51d6f4e390515e

# Backend API URL - UPDATE THIS FOR PRODUCTION
VITE_API_URL=http://localhost:5001
EOF
        print_success "Created frontend/.env file"
        print_warning "Please update VITE_API_URL to your production backend URL"
    fi
else
    print_success "Frontend .env file exists"
fi

cd ..

echo ""
echo "Step 3: Checking Backend Configuration"
echo "--------------------------------------"
cd backend

if [ ! -f ".env" ]; then
    print_warning "Backend .env file not found"
    echo ""
    read -p "Would you like to create a .env template? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > .env << 'EOF'
# Server Configuration
PORT=5001
NODE_ENV=development

# OpenAI API Key - REQUIRED
OPENAI_API_KEY=your-openai-api-key

# Firebase Admin SDK - REQUIRED for auth
FIREBASE_PROJECT_ID=coa-pdf-processor
FIREBASE_CLIENT_EMAIL=your-firebase-admin-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"

# Stripe Configuration - UPDATE TO LIVE KEYS FOR PRODUCTION
STRIPE_SECRET_KEY=sk_test_your-test-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-test-key

# Admin Configuration
ADMIN_EMAIL=admin@coaprocessor.com
ADMIN_PASSWORD=change-this-password
EOF
        print_success "Created backend/.env file"
        print_warning "Please fill in all the environment variables"
    fi
else
    print_success "Backend .env file exists"
fi

cd ..

echo ""
echo "Step 4: Building Frontend"
echo "------------------------"
cd frontend
print_info "Building frontend for production..."
if npm run build; then
    print_success "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "Step 5: Checking Deployment Requirements"
echo "---------------------------------------"

# Check if Firebase CLI is installed
if command -v firebase &> /dev/null; then
    print_success "Firebase CLI is installed"
else
    print_warning "Firebase CLI not installed"
    print_info "Install with: npm install -g firebase-tools"
fi

# Check if poppler is installed (for PDF processing)
if command -v pdfimages &> /dev/null; then
    print_success "Poppler utilities are installed"
else
    print_warning "Poppler not installed (required for PDF processing)"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Install with: brew install poppler"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Install with: sudo apt-get install poppler-utils"
    fi
fi

echo ""
echo "========================================"
echo "🎉 Setup Complete!"
echo "========================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update environment variables:"
echo "   - frontend/.env: Set VITE_API_URL to your production backend"
echo "   - backend/.env: Add your API keys (OpenAI, Firebase, Stripe)"
echo ""
echo "2. Review security checklist:"
echo "   - Switch Stripe to live mode keys"
echo "   - Update Firebase security rules"
echo "   - Configure CORS for production domains"
echo ""
echo "3. Deploy:"
echo "   Frontend: cd frontend && npm run deploy"
echo "   Backend: Deploy to your hosting platform (DigitalOcean, etc.)"
echo ""
echo "4. Test thoroughly before going live!"
echo ""
echo "📚 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions"
echo "⚡ See QUICK_LAUNCH_CHECKLIST.md for quick reference"
echo ""


