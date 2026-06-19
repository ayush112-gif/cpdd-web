# CPDD Placement Agent - Setup Guide

## 📦 Files Included

### Backend Files
- **index_final_integrated.js** - Main backend server with Express + Telegram Bot + Web API
- **openrouter.js** - AI integration for text extraction, mail generation (KEEP AS-IS)

### Frontend Files
- **cpdd_ui.html** - Web interface (served by Express at http://localhost:3000/)

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies
```bash
npm install express cors multer dotenv node-telegram-bot-api nodemailer pdf-parse openai
```

### Step 2: Create `.env` File
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# OpenRouter API (for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key

# Email Service - Choose ONE (or setup both)

# Option A: Gmail (Local/Development)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Option B: Brevo (Production/Render)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=GCET Placement Cell (CPDD)

# Server
PORT=3000
```

### Step 3: File Structure
```
project/
├── index_final_integrated.js  (← MAIN BACKEND FILE)
├── openrouter.js               (← AI SERVICE)
├── cpdd_ui.html                (← WEB UI)
├── .env                        (← YOUR SECRETS)
├── package.json
├── uploads/                    (← AUTO-CREATED)
└── node_modules/
```

### Step 4: Start the Server
```bash
node index_final_integrated.js
```

Expected output:
```
✅ SMTP Ready (nodemailer/Gmail)
🤖 Placement Agent Started [Local/Gmail]
🌐 Server running on port 3000
📱 Web UI available at http://localhost:3000
🤖 Telegram Bot running in polling mode
```

---

## 💻 How to Use

### Web UI (Browser)
1. Open: **http://localhost:3000/**
2. Paste a job notice or upload PDF/Image
3. Click "Run analysis"
4. Generate mail or WhatsApp message
5. Enter recipient email and send

### Telegram Bot
1. Start with `/start`
2. Choose "Analyze Placement Notification" or "Write Custom Mail"
3. Upload PDF, image, or paste text
4. Generate mail/WhatsApp
5. Add attachments and send

---

## 🔧 API Endpoints (for custom integrations)

### POST /api/analyze-notice
Extracts job details from text
```javascript
POST http://localhost:3000/api/analyze-notice
Content-Type: application/json

{
  "text": "JOB NOTIFICATION TEXT HERE..."
}
```

### POST /api/extract-pdf
Extracts text from PDF file
```javascript
POST http://localhost:3000/api/extract-pdf
Content-Type: multipart/form-data

[file upload]
```

### POST /api/extract-image
Extracts text from image using AI vision
```javascript
POST http://localhost:3000/api/extract-image
Content-Type: multipart/form-data

[file upload]
```

### POST /api/generate-mail
Generates professional placement email
```javascript
POST http://localhost:3000/api/generate-mail
Content-Type: application/json

{
  "originalText": "JOB NOTIFICATION",
  "jobData": { "company_name": "...", ... }
}
```

### POST /api/generate-custom-mail
Generates custom mail from instruction
```javascript
POST http://localhost:3000/api/generate-custom-mail
Content-Type: application/json

{
  "instruction": "Send mail about tomorrow's event at 4 PM"
}
```

### POST /api/generate-whatsapp
Generates WhatsApp broadcast message
```javascript
POST http://localhost:3000/api/generate-whatsapp
Content-Type: application/json

{
  "originalText": "JOB NOTIFICATION",
  "jobData": { "company_name": "...", ... }
}
```

### POST /api/send-mail
Sends email (uses Brevo on Render, nodemailer locally)
```javascript
POST http://localhost:3000/api/send-mail
Content-Type: application/json

{
  "to": "recipient@gmail.com",
  "subject": "[Placement] Company Name",
  "body": "Mail body text...",
  "jobData": { ... }
}
```

---

## ✨ Features

### ✅ Web UI
- Beautiful, responsive interface
- Real-time job notice analysis
- Mail & WhatsApp draft generation
- Animated loading states
- Smooth transitions & interactions

### ✅ Telegram Bot
- Full-featured bot with inline keyboard
- PDF & image processing
- Custom mail creation
- Attachment management
- Scheduled sending (coming soon)

### ✅ Email Services (DONO RKHNE)
**Local/Development:**
- Uses Gmail with nodemailer
- Direct SMTP connection

**Production/Render:**
- Uses Brevo HTTP API
- Auto-selects based on `RENDER` env var

### ✅ AI Features
- Job detail extraction
- Professional mail generation
- WhatsApp message creation
- Custom mail writing
- Image/PDF text extraction (OCR)
- Uses OpenRouter free models

---

## 📝 Key Features Kept (PURANA CODE)

✅ Telegram bot with /start command  
✅ PDF upload & parsing  
✅ Image upload & OCR  
✅ Job notification analysis  
✅ Mail generation with templates  
✅ WhatsApp message creation  
✅ Both email services (nodemailer + Brevo)  
✅ File attachment handling  
✅ Professional HTML email templates  
✅ OpenRouter API integration  
✅ All callback handlers  
✅ Activity logging  
✅ Error handling  

**NOTHING WAS REMOVED!** 🎉

---

## 🌐 Deployment to Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "CPDD Placement Agent"
git push origin main
```

### Step 2: Create Render Service
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Set build command: `npm install`
5. Set start command: `node index_final_integrated.js`

### Step 3: Add Environment Variables
In Render dashboard:
- `TELEGRAM_BOT_TOKEN=...`
- `OPENROUTER_API_KEY=...`
- `BREVO_API_KEY=...`
- `BREVO_SENDER_EMAIL=...`
- `PORT=3000`

### Step 4: Deploy
Render will auto-detect Node.js and deploy! 🚀

---

## 🐛 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install express cors multer dotenv node-telegram-bot-api nodemailer pdf-parse openai
```

### Gmail Auth Error
1. Use [App Password](https://support.google.com/accounts/answer/185833), not regular password
2. Enable "Less secure app access" (or use nodemailer OAuth)

### OpenRouter Rate Limited
- Free models may rate limit
- Backend automatically retries with other free models
- If all exhausted, wait & try again

### Brevo Send Failed
- Check `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`
- Verify email is authenticated in Brevo dashboard

### Telegram Bot Not Responding
- Check `TELEGRAM_BOT_TOKEN` is correct
- Make sure bot is running in polling mode
- Check console logs for errors

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│         Web UI (Browser)                │
│      cpdd_ui.html (React-less)          │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
               ↓
┌─────────────────────────────────────────┐
│   Express Server (Node.js)              │
│  index_final_integrated.js              │
├─────────────────────────────────────────┤
│  ✓ Web API Routes                       │
│  ✓ Telegram Bot Handler                 │
│  ✓ File Upload & Processing             │
│  ✓ Email Sending (Nodemailer/Brevo)     │
└──────────────┬──────────────────────────┘
               │
      ┌────────┼────────┐
      ↓        ↓        ↓
   OpenRouter  PDF    Image
   AI API      Parse  OCR
```

---

## 🎯 Next Steps

1. **Setup `.env` file** with your API keys
2. **Run** `npm install`
3. **Start** with `node index_final_integrated.js`
4. **Open** http://localhost:3000 in browser
5. **Test** with a sample job notice
6. **Deploy** to Render when ready

---

## 📞 Support

For issues or questions:
- Check console logs: `node index_final_integrated.js`
- Verify `.env` variables
- Check internet connection for API calls
- Review error messages in browser console

---

**Made with ❤️ for GCET Placement Cell (CPDD)**
