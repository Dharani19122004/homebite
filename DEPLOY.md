# Deploying HomeBite (Render + Vercel + MongoDB Atlas)

Backend (Express API) → **Render**  ·  Frontend (React) → **Vercel**  ·  Database → **MongoDB Atlas**

Both Render and Vercel have free tiers. Note: Render's free service **goes to sleep after ~15 minutes idle**, so the first request after a break takes about 30–60 seconds to wake up.

You will need free accounts on GitHub, Render (render.com) and Vercel (vercel.com), plus your MongoDB Atlas cluster.

---

## 1. MongoDB Atlas (one-time)

1. Atlas → your project → **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Render's free plan has changing IP addresses, so a fixed IP cannot be used.
2. Copy your connection string and put the database name after the host:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/HomeBite?appName=Cluster0`
   (If your password has special characters like `@` or `#`, URL-encode them.)

## 2. Push the project to GitHub

The project already has a local Git repository with one commit (secrets such as `backend/.env` are excluded).

1. On github.com create a **new empty repository** (for example `homebite`; do **not** add a README).
2. In the project folder run (replace the URL with yours):
   ```
   git remote add origin https://github.com/YOUR-USERNAME/homebite.git
   git branch -M main
   git push -u origin main
   ```
3. Check on GitHub that **no `.env` file** appears in the repository.

## 3. Backend on Render

1. Render → **New +** → **Web Service** → connect your GitHub repo.
2. Settings:
   | Setting | Value |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Health Check Path | `/` |
   | Instance type | Free |
3. **Environment variables** (Environment tab). Use `backend/.env.example` as the checklist:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas string from step 1 (with `/HomeBite`) |
   | `JWT_SECRET` | a NEW long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `EMAIL_USER`, `EMAIL_PASS` | same as your local `.env` (Gmail app password) |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | same as local |
   | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | your **test** keys (`rzp_test_…`) |
   | `FRONTEND_URL` | leave empty for now; you set it in step 5 |

   Do not set `PORT` – Render provides it.
4. Deploy. When it shows **Live**, open `https://YOUR-SERVICE.onrender.com/` – you should see
   `{"success":true,"message":"HomeBite Backend API is running"}`.

## 4. Frontend on Vercel

1. Vercel → **Add New… → Project** → import the same GitHub repo.
2. Settings:
   | Setting | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
3. **Environment Variables:**
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` (must end with `/api`) |
   | `VITE_RAZORPAY_KEY_ID` | your test key id `rzp_test_…` |
4. Deploy. You get a URL like `https://homebite-xxxx.vercel.app`. (`frontend/vercel.json` makes page refreshes on routes such as `/customer/orders` work.)

## 5. Connect the two (CORS)

Back in Render → your service → Environment → set
`FRONTEND_URL` = your Vercel URL, **no trailing slash** (e.g. `https://homebite-xxxx.vercel.app`) → save (it redeploys).

Only that website can then call your API from a browser.

## 6. Create the admin account (once)

Your hosted database is empty at first. On your computer, in the `backend` folder, with `backend/.env` pointing at Atlas:

```
ADMIN_PASSWORD="choose-a-strong-password" node createAdmin.js
```
Log in on the website with role **Admin**, email `admin@homebite.com` (or set `ADMIN_EMAIL`) and the password you chose. There is no default password any more.

## 7. Test the live site

- [ ] Home page loads; refresh on `/about` still works
- [ ] Register a customer and log in
- [ ] Register a vendor/home chef (uploads an image to Cloudinary), approve it as admin
- [ ] Vendor adds a product; customer sees it, adds to cart, places a COD order
- [ ] Razorpay test payment works (test card `4111 1111 1111 1111`, any future date, any CVV)
- [ ] Admin assigns a delivery partner; the customer sees the notification with the OTP

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Browser console: *blocked by CORS policy* | `FRONTEND_URL` on Render is missing, has a trailing slash, or differs from the Vercel URL |
| Login says *Network error* | `VITE_API_URL` wrong (must be the Render URL + `/api`); after changing a `VITE_…` variable, **redeploy** Vercel |
| First request very slow | Render free service was asleep – wait ~1 minute |
| Render log: `MongoDB Connection Error` | Atlas Network Access not open to `0.0.0.0/0`, wrong password (URL-encode it), or missing `/HomeBite` |
| Images fail to upload | Cloudinary variables missing on Render |
| Password-reset email not sent | `EMAIL_USER` / `EMAIL_PASS` (Gmail needs an *app password*) missing on Render |

## Good to know

- Razorpay stays in **test mode** (no real money).
- Never commit `.env` files. If a secret was ever exposed, rotate it.
- Free Render/Vercel/Atlas tiers are meant for learning and demos, not production traffic.
