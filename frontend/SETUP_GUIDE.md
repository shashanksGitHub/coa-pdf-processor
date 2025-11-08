# 🚀 Quick Setup Guide

Follow these steps to get your COA PDF Processor running with GPT-4 Vision.

## ✅ Prerequisites Checklist

- [x] Node.js 18+ installed
- [x] OpenAI API Key (already have: `sk-proj-eoUO...`)
- [ ] Poppler utils installed (for PDF processing)
- [ ] Two terminal windows ready

## 📦 Step 1: Install Poppler (PDF Processing Tool)

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**Verify installation:**
```bash
which pdftotext
```

## 🔧 Step 2: Configure Environment Variables

Your backend `.env` file is already created at `backend/.env` with your OpenAI API key.

**Verify it contains:**
```bash
cat backend/.env
```

Should show:
```
OPENAI_API_KEY=sk-proj-eoUO...
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
...
```

## 🖥️ Step 3: Start the Backend Server

**Terminal 1:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 COA PDF Processor API Server
================================
✅ Server running on port 5000
✅ Environment: development
✅ CORS enabled for: http://localhost:5173
✅ OpenAI API configured
```

**Keep this terminal running!**

## 🌐 Step 4: Start the Frontend

**Terminal 2:**
```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## 🎉 Step 5: Test the Application

1. Open browser to `http://localhost:5173`
2. Login or register with your email
3. Upload a COA PDF file
4. Watch GPT-4 Vision extract the data!
5. Add company info (optional)
6. Download your formatted PDF

## 🧪 Testing the API Directly

**Health check:**
```bash
curl http://localhost:5000/api/health
```

**Upload and process a PDF:**
```bash
curl -X POST http://localhost:5000/api/extract-only \
  -F "pdfFile=@/path/to/your/test.pdf"
```

## 🐛 Troubleshooting

### Backend won't start

**Error: "pdf-poppler not found"**
```bash
# Install poppler
brew install poppler  # macOS
```

**Error: "OPENAI_API_KEY is not set"**
```bash
# Check .env file exists
cat backend/.env

# Make sure it has your API key
echo 'OPENAI_API_KEY=sk-proj-eoUO...' >> backend/.env
```

### Frontend can't connect to backend

**Error: "Failed to fetch" or CORS error**
```bash
# Make sure backend is running
curl http://localhost:5000/api/health

# Check CORS_ORIGIN in backend/.env
echo "CORS_ORIGIN=http://localhost:5173" >> backend/.env
```

### GPT-4 Vision errors

**Error: "Insufficient credits"**
- Check your OpenAI account has credits: https://platform.openai.com/account/billing

**Error: "Rate limit exceeded"**
- Wait a few seconds and try again
- GPT-4 has rate limits for free tier accounts

## 💰 Cost Monitoring

Each PDF processing costs approximately:
- **Text extraction**: ~$0.05-0.10 per page
- **With generation**: ~$0.10-0.20 per PDF

Monitor usage at: https://platform.openai.com/usage

## 📁 Project Structure

```
✅ backend/              # Express API server
   ✅ src/               # Source code
   ✅ uploads/           # Temporary uploads (auto-created)
   ✅ output/            # Generated PDFs (auto-created)
   ✅ .env               # Your API key (configured)

✅ src/                  # Frontend React app
   ✅ components/        # UI components
   ✅ services/          # API calls to backend
   ✅ config/            # Firebase config

✅ package.json          # Frontend dependencies
✅ README.md             # Full documentation
```

## 🎯 Next Steps

1. **Test with sample PDFs**: Try different COA formats
2. **Customize branding**: Add your company logo in step 2
3. **Deploy to production**: See deployment section in README.md
4. **Monitor costs**: Keep an eye on OpenAI usage

## 🔒 Security Reminders

- ✅ Your OpenAI API key is safely stored in `backend/.env`
- ✅ `.env` is gitignored (won't be committed)
- ⚠️ Never share your `.env` file
- ⚠️ Don't commit API keys to version control

## 📞 Getting Help

If you encounter issues:

1. **Check logs**: Look at terminal outputs for error messages
2. **Verify prerequisites**: Ensure all dependencies are installed
3. **Test API**: Use curl to test backend endpoints directly
4. **Check OpenAI status**: https://status.openai.com

## ✨ Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can access dashboard at http://localhost:5173
- [ ] Can upload a PDF
- [ ] GPT-4 successfully extracts data
- [ ] Can download formatted PDF

---

**You're all set! 🎊**

Start uploading COA PDFs and let GPT-4 Vision do the magic!

