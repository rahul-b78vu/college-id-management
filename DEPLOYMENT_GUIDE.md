# 🚀 Permanent 24/7 Cloud Deployment Guide

Your project is completely pre-configured for **1-click permanent cloud deployment** on **Render.com** (100% Free, works 24/7 forever even after shutting down your computer).

---

## 📌 Step 1: Create a GitHub Repository (1 Minute)

1. Open your browser and go to: **[github.com/new](https://github.com/new)**
2. Set **Repository name** to: `college-id-management`
3. Leave it **Public** (or Private) and DO NOT check "Add a README" (your repository is already initialized).
4. Click **Create repository**.

Now run these 3 commands in your VS Code terminal:
```bash
cd College-ID-Management
git branch -M main
git remote add origin https://github.com/rahul-b78vu/college-id-management.git
git push -u origin main
```

---

## 📌 Step 2: Deploy to Render (2 Minutes - Free 24/7 Hosting)

1. Open **[render.com](https://render.com)** and click **Sign in with GitHub**.
2. Click the blue **New +** button at the top right &rarr; choose **Web Service**.
3. Select your repository: **`college-id-management`** &rarr; click **Connect**.
4. Configure these fields (Render will auto-fill most from `render.yaml`):
   - **Name**: `vignan-college-id` (or your chosen name)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, click **Add Environment Variable**:
   - **Key**: `MONGO_URI`
   - **Value**: *(Copy your MongoDB Atlas connection string from `backend/.env`)*
6. Click **Deploy Web Service**!

---

## 🎉 Result
Render will build and launch your application in ~2 minutes.
You will get a permanent HTTPS link:
👉 **`https://vignan-college-id.onrender.com`**

- **Works 24/7/365 permanently**
- **Works even when your computer is completely turned off**
- **Mobile cameras scanning the QR code will open it from anywhere in the world on any 4G/5G or Wi-Fi network!**

