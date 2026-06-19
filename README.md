# 🚀 CPDD Placement Agent - Complete Backend + UI Integration

## ✨ What You Got

**PURANA CODE SAHI RAKHA HAI** ✅
- ✅ Telegram Bot (polling mode) - SAHI HAI
- ✅ Both Email Services (Nodemailer + Brevo) - DONO RKHNE
- ✅ PDF/Image Processing - SAHI HAI
- ✅ OpenRouter AI Integration - SAHI HAI
- ✅ All existing callbacks - SAHI HAI

**NAYA CODE ADD KIA** 🎯
- 🆕 Express Web Server
- 🆕 REST API Endpoints
- 🆕 Web UI Integration (beautiful HTML/CSS/JS)
- 🆕 File upload handling
- 🆕 CORS support

---

## 📁 Files Provided

```
📦 CPDD Placement Agent
├── 📄 index.js                    ← BACKEND (use as index_final.js)
├── 📄 cpdd_ui.html               ← WEB INTERFACE (serve as static)
├── 📄 package.json               ← NPM DEPENDENCIES
├── 📄 SETUP_GUIDE.md             ← DETAILED SETUP
├── 📄 cpdd_placement_agent_enhanced.html  ← ENHANCED UI DEMO (extra)
└── 📄 README.md                  ← THIS FILE
```

---

## ⚡ Quick Start (5 Minutes)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Create `.env` File
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# AI Service
OPENROUTER_API_KEY=your_openrouter_key_here

# Email Option 1: Gmail (Local)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Email Option 2: Brevo (Production)
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=noreply@example.com
BREVO_SENDER_NAME=GCET Placement Cell

# Server
PORT=3000
```

### 3️⃣ Start Server
```bash
npm start
```

### 4️⃣ Open in Browser
```
http://localhost:3000
```

---

## 🎯 How It Works

### **Web Interface** (Browser)
1. Open http://localhost:3000
2. Paste job notice or upload PDF/Image
3. Click "Run analysis"
4. Generate mail or WhatsApp message
5. Enter email and send

### **Telegram Bot**
1. Add bot to Telegram
2. Send `/start`
3. Choose analyze or custom mail
4. Upload files or paste text
5. Generate and send

### **Both Work Simultaneously**
- Web UI: Modern, pretty interface
- Telegram: Chat-based, accessible anywhere

---

## 🏗️ Architecture

```
Your Browser (Web UI)
        ↓
http://localhost:3000
        ↓
Express Server (Node.js)
        ├─→ Route: /api/analyze-notice
        ├─→ Route: /api/generate-mail
        ├─→ Route: /api/send-mail
        └─→ Also runs: Telegram Bot
```

---

## 🔌 API Endpoints (if you need them)

| Method | Endpoint | Use |
|--------|----------|-----|
| POST | `/api/analyze-notice` | Extract job details |
| POST | `/api/extract-pdf` | Read PDF text |
| POST | `/api/extract-image` | Read image with AI |
| POST | `/api/generate-mail` | Create email |
| POST | `/api/generate-custom-mail` | Custom email |
| POST | `/api/generate-whatsapp` | WhatsApp message |
| POST | `/api/send-mail` | Send email |

---

## 📧 Email Services (DONO USE)

### **Local Development (Gmail)**
- Uses: Nodemailer
- Setup: App Password from Gmail
- Best for: Testing locally

### **Production (Render/Brevo)**
- Uses: Brevo HTTP API
- Setup: API key from Brevo
- Best for: Production/Render deployment
- Auto-detection: If `RENDER` env var exists

**Both are configured - pick one!**

---

## 🚀 Deployment to Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add CPDD Placement Agent"
git push origin main
```

### Step 2: Create Render Service
1. Go to https://render.com
2. Create Web Service
3. Connect your GitHub repo
4. Build command: `npm install`
5. Start command: `npm start`

### Step 3: Environment Variables
Add to Render:
```
TELEGRAM_BOT_TOKEN=...
OPENROUTER_API_KEY=...
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
```

### Step 4: Deploy
Click "Create Web Service" - Done! 🎉

---

## ❓ Common Questions

### Q: Do I need to remove old code?
**A:** No! All old code is kept. Telegram bot still works exactly the same.

### Q: Can I use both Gmail and Brevo?
**A:** Yes! The code auto-selects based on environment.

### Q: Where do I put the HTML files?
**A:** Express serves `cpdd_ui.html` automatically at `/`

### Q: How do I use OpenRouter API?
**A:** It's already integrated! Same as before.

### Q: Can I access the bot while using web UI?
**A:** Yes! Both run at the same time.

### Q: What about file uploads?
**A:** New `/uploads` folder is created automatically. Old uploads still work.

### Q: Is there authentication?
**A:** Not yet. Add basic auth if you need it.

---

## 🔧 Troubleshooting

### Server won't start
```bash
# Check Node version
node --version  # Should be 16+

# Try again
npm install
npm start
```

### Port 3000 already in use
```bash
# Use different port
PORT=4000 npm start
```

### API calls fail
```
Check browser console (F12) → Network tab
See what error the API returned
```

### Gmail auth error
1. Use [App Password](https://support.google.com/accounts/answer/185833)
2. Not regular Gmail password
3. Generate new app password

### Telegram bot doesn't respond
1. Check `TELEGRAM_BOT_TOKEN` in `.env`
2. Verify bot is running (check console)
3. Check you sent `/start`

---

## 📊 What's New vs Old

### ✅ Kept (All Old Code)
- Telegram bot (/start, callbacks, etc)
- PDF processing
- Image OCR
- Mail generation
- WhatsApp creation
- Nodemailer
- Brevo API
- OpenRouter integration
- File handling
- Error handling

### 🆕 Added
- Express web server
- REST API endpoints
- Web UI (beautiful interface)
- CORS support
- Static file serving
- Multer for uploads
- API error handling

---

## 📝 Key Files Explained

### **index.js** (was index_final_integrated.js)
- Main backend server
- Everything in one file
- Telegram bot + Web API
- Express routes + handlers

### **cpdd_ui.html**
- Standalone HTML file
- No dependencies (except fonts from CDN)
- Connects to API endpoints
- Beautiful, animated interface

### **openrouter.js**
- Kept as-is (no changes)
- All AI functions
- Vision models for images
- Text extraction
- Mail generation

### **package.json**
- All NPM dependencies
- Start scripts
- Project info

---

## 🎨 UI Features

✨ Eye-catching animations
✨ Smooth transitions
✨ Real-time feedback
✨ Loading states with spinner
✨ Toast notifications
✨ Responsive design
✨ Beautiful color scheme
✨ Mobile-friendly

---

## 🚦 Next Steps

1. ✅ Download files (already done)
2. ✅ Create `.env` file (copy template above)
3. ✅ Run `npm install`
4. ✅ Run `npm start`
5. ✅ Open http://localhost:3000
6. ✅ Test it out!
7. ✅ Deploy to Render (optional)

---

## 💡 Tips & Tricks

### Use nodemailer locally
```bash
PORT=3000 EMAIL_USER=your@gmail.com EMAIL_PASS=... npm start
```

### Use Brevo in production
```bash
# Set in Render environment
BREVO_API_KEY=sk_...
BREVO_SENDER_EMAIL=noreply@...
```

### Check API directly
```bash
curl -X POST http://localhost:3000/api/analyze-notice \
  -H "Content-Type: application/json" \
  -d '{"text":"job notice text here"}'
```

### Debug Telegram
```bash
# Enable verbose logging in bot
// bot.on('text', msg => console.log('RAW:', msg));
```

---

## 📞 Support

- Check console logs: `npm start`
- Read errors carefully
- Check `.env` variables
- Try refreshing browser (hard refresh: Ctrl+Shift+R)
- Check API endpoints with Postman

---

## ✅ Checklist Before Going Live

- [ ] All API keys in `.env`
- [ ] `npm install` successful
- [ ] `npm start` runs without errors
- [ ] Web UI loads at http://localhost:3000
- [ ] Can analyze a test job notice
- [ ] Can generate mail
- [ ] Can send email
- [ ] Telegram bot responds to `/start`
- [ ] Both services work together

---

## 📄 License

MIT - Use freely for GCET Placement Cell

---

## 👨‍💻 Made by

**Ayush Shukla**
Placement Coordinator, GCET
CPDD - Career Planning & Development Division

---

**IMPORTANT: PURANA CODE SAHI RAKHA, NAYA UI ADD KIA, DONO EMAIL RKHNE** ✅

Enjoy! 🎉
