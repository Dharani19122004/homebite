# HomeBite – Project Audit Report

*Written for: the project owner and reviewers of the HomeBite college project.*

Scope: full-stack inspection, security hardening, design-system work, dashboard and public-page polish, functional testing and responsive testing of the existing HomeBite application (React + Vite frontend, Express + MongoDB backend).

**How to read the results:** every "Passed" below was actually executed. Anything not executed is listed under "Not verified" and is never counted as passed. Tests ran against the real backend and the real MongoDB using clearly tagged test records (`@qa.homebite.test` accounts and everything attached to them), which were deleted afterwards. Before/after record counts and total product stock were compared and matched.

---

## 1. Project Status

| Area | Status |
|---|---|
| **Frontend** | Builds successfully (2,105 modules). 38 page files, 31 components, 57 CSS files, 57 routes. Lint: 0 errors, 11 warnings (all the same `set-state-in-effect` style hint in data-loading code that pre-dates this audit). All 426 relative imports verified case-sensitively (safe for Linux builds). |
| **Backend** | Starts cleanly. 44 modules load with no errors. 75 route definitions across 13 route files. 10 model imports with wrong file-name capitalisation (in 7 files) were corrected (they would have crashed on a Linux server). |
| **Database** | MongoDB connection verified. Relationships (order→delivery→notification, booking→rating, product stock) verified through the workflow tests. No data lost or altered by testing. |
| **Authentication** | JWT (7-day expiry), bcrypt-hashed passwords, role-based access on every protected route. Admin cannot self-register. Verified for all five roles. |
| **Overall** | Feature-complete for the scope tested and **substantially hardened**. The most serious problems found were security holes (unauthenticated access to other users' orders/bookings, unverified payments); all are fixed and re-tested. A few items need your action (see section 8). |

### Roles
Customer · Vendor (restaurant / grocery) · Home Chef (uses the vendor layout) · Delivery Partner · Admin.

---

## 2. Pages Tested

98 page-views were rendered at each of 6 screen sizes (588 loads), plus 7 modals at 4 sizes. Final result: **0 problems** (no horizontal overflow, no content escaping the screen, no broken images, no page errors, no failed API calls, no stuck loading states).

| Page group | Pages | Status | Issues found | Fix applied |
|---|---|---|---|---|
| Public | Home, About, Contact, Login, Register, Forgot Password, Verify OTP, Reset Password | Pass | Home was a single welcome block; no About/Contact/footer; hamburger menu missing on phones | New hero, services, how-it-works, role sections, footer, About, Contact, mobile menu, split-screen auth layout |
| Customer | Dashboard, Restaurants (+detail), Groceries (+detail), Home Chefs (+detail), Food Rescue, My Orders, My Bookings, Cart, Profile, AI Chat (FAQ assistant) | Pass | White empty sidebar while scrolling; booking form always open; blank block for a 10×10px vendor image; mobile menu hid the active tab | Sticky sidebar; booking form opens in a dialog; image fallback; active tab scrolls into view |
| Vendor / Grocery | Dashboard, Products, Add Product, Orders, Sales, Ratings & Reports, My Store, Profile | Pass | Sidebar brand unstyled (regression I caused and fixed); horizontal scroll from a hidden file input; product buttons wrapping | Restored styles; contained the input; 3-column button row |
| Home Chef | Dashboard, Products, Orders, Booking Services, Ratings, My Store | Pass | Shares the vendor layout (no separate dashboard) | Documented (see section 8) |
| Delivery | Dashboard, My Deliveries, Profile | Pass | Empty header card on the left | Added title; compact on phones |
| Admin | Dashboard, Users, Vendors, Home Chefs, Products, Orders, Deliveries, Bookings, Feedback, Food Rescue, Profile | Pass | Tables squeezed into unreadable columns on phones; broken product image icon | Readable min-width with sideways scroll; SafeImage fallback |

---

## 3. Dashboards Tested

| Dashboard | UI status | Functional status | Issues |
|---|---|---|---|
| Customer | Consistent cards/badges; responsive; skeleton + empty states on My Orders | Order, cancel, booking, rating flows verified in the real UI | Old set-state-in-effect lint hints |
| Vendor (restaurant/grocery) | Consistent | Accept → Preparing → Ready, reject/cancel with dialog, product CRUD, stock and availability verified | Out-of-stock bug fixed (see section 7) |
| Home Chef | Consistent (shared layout) | Accept / reject / complete bookings; customer sees updated status | No separate dashboard |
| Delivery Partner | Consistent | Picked up → Out for delivery → OTP verify → Delivered verified in the real UI; wrong OTP rejected | None open |
| Admin | Consistent, real backend numbers | Assign partner (business rules enforced), vendor approve/reject/activate/deactivate, all list pages load | No admin write actions for orders (read-only by design) |

---

## 4. API Testing

Tested with real HTTP requests. Status codes shown are the ones asserted. "401" = no/invalid token, "403" = wrong role or someone else's data.

| Endpoint | Method | Status | Result |
|---|---|---|---|
| `/auth/login` | POST | Pass | valid → 200 + token; wrong password → 401; missing fields → 400 |
| `/auth/register` | POST | Pass | valid customer → account created with hashed password; duplicate email → 409; admin role → 403 |
| `/auth/profile` | GET / PATCH | Pass | 200; duplicate phone → 409; expired token → 401 |
| `/auth/forgot-password`, `/verify-otp`, `/reset-password` | POST | **Not tested** | Sends real email |
| `/users`, `/users/:id` | GET | Pass | admin 200, customer 403, anonymous 401; password never returned |
| `/vendor`, `/vendor/type/:type`, `/vendor/user/:id`, `/vendor/:id` | GET | Pass | pending/inactive vendors are not publicly listed |
| `/vendor/:id/approve`, `/reject`, `/activate`, `/deactivate` | PATCH | Pass | admin only; vendor cannot approve themselves |
| `/vendor/create`, `PUT /vendor/:id` (store save) | POST/PUT | **Not tested** | Image upload to Cloudinary |
| `/products`, `/products/vendor/:id`, `/products/:id` | GET | Pass | unknown id → 404 |
| `/products/create`, `PUT /products/:id`, `DELETE /products/:id` | POST/PUT/DELETE | Pass | invalid price/quantity/type → 400; other vendor / customer → 403 |
| `/products/:id/activate`, `/deactivate` | PATCH | Pass | activating a zero-stock item → 400 with a clear message |
| `/orders/create` | POST | Pass | own account only; stock reduced; missing fields → 400 |
| `/orders/create-razorpay` | POST | Pass | Verified in Razorpay TEST mode with a real checkout payment (`pay_…`): valid signature + matching amount → 201 paid order, stock reduced. Forged signature → 400; reused payment → 400; paying ₹1 for a ₹240 order → 400 with no order; unknown Razorpay order → 502; other customer → 403 |
| `/orders`, `/orders/type/:type` | GET | Pass | admin only |
| `/orders/customer/:id`, `/orders/:id`, `/orders/vendor/:id` | GET | Pass | owner / owning vendor / assigned partner / admin only; OTP hidden from vendor and partner |
| `/orders/:id/status` | PATCH | Pass | valid transitions only; other vendor / customer → 403; vendor cannot skip to delivery steps |
| `/orders/:id/cancel` | PATCH | Pass | owner or admin; delivered order cannot be cancelled; stock restored |
| `/deliveries`, `/deliveries/pending`, `/deliveries/:id`, `/deliveries/partner/:id` | GET | Pass | admin / assigned partner only |
| `/deliveries/:id/assign` | PATCH | Pass | admin only; bad id 400, unknown 404, non-partner 400, non-pending 400; exactly one notification |
| `/deliveries/:id/status` | PATCH | Pass | assigned partner only; invalid jump / cancel / direct "delivered" rejected |
| `/deliveries/:id/verify-otp` | POST | Pass | wrong / malformed / missing OTP rejected; other partner and customer rejected; OTP cannot be reused |
| `/bookings`, `/bookings/availability` | POST / GET | Pass | own account only; guest count 0, past date, invalid date, non-chef vendor → 400; same slot → "appointment" |
| `/bookings/customer/:id`, `/bookings/:id`, `/bookings/homechef/:id` | GET | Pass | owner / owning chef / admin only |
| `/bookings/:id/accept`, `/reject`, `/complete`, `/cancel` | PUT | Pass | owning chef only; invalid transitions → 400 |
| `/payment/create-order` | POST | Pass | Real test-mode Razorpay order created (24000 paise, INR); invalid amounts (0, negative, text, missing) → 400 |
| `/payment/verify` | POST | Pass | valid signature → verified; one wrong character → rejected |
| `/notifications/customer/:id`, `/notifications/:id/read` | GET / PATCH | Pass | own notifications only; OTP hidden once delivered |
| `/notifications/customer/:id/read-all` | PATCH | Partial | login required verified; behaviour not exercised |
| `/ratings`, `/ratings/customer/:id`, `/ratings/vendor/:id` | POST / GET | Pass | rating 0 / 9 / missing target → 400; only own delivered order or completed booking; duplicate → 409 |
| `/ratings/delivery-partner/:id` | GET | **Not tested** | |
| `/reports`, `/reports/vendor/:id`, `/reports/delivery-partner/:id`, `/reports/:id/status` | POST / GET / PATCH | Pass | admin-only status change; empty subject → 400 |
| `/food-rescue` (create / list / get / take / delete) | mixed | Pass | expiry, quantity and login checks; two people taking the last plate at once → exactly one succeeds; only creator can delete. **Image upload not tested** |
| `/admin/dashboard-stats`, `/admin/bookings`, `/admin/ratings`, `/admin/reports` | GET | Pass | admin 200, customer 403, anonymous 401 |

Suites: **75/75** (security and authorisation) + **144/144** (workflows and validation), re-run on the final code.

---

## 5. Workflow Testing

| Workflow | Result | Issues |
|---|---|---|
| 1 – Customer ordering (browse → cart → COD checkout → My Orders → cancel → stock restore) | Pass (real UI) | Also verified with the real Razorpay TEST checkout (card payment → paid order → My Orders) |
| 2 – Vendor management (accept → preparing → ready, reject/cancel dialogs, product CRUD, stock, availability) | Pass (API + real UI) | Product image upload not tested |
| 3 – Home Chef (accept / reject / complete; slot clash becomes appointment; customer sees status; rating after completion) | Pass (API + real UI) | Chef registration not tested |
| 4 – Delivery partner (picked up → out for delivery → wrong OTP rejected → correct OTP → delivered; order follows) | Pass (real UI) | |
| 5 – Admin (assignment rules, vendor moderation, all list pages, report handling) | Pass (API + real UI) | |
| Delivery assignment → customer notification (partner name, phone, OTP, ETA window from the database; exactly one per assignment; failed assignment creates none) | Pass | ETA is a fixed configurable window, not GPS |
| Food Rescue | Pass (API) | Image upload not tested |
| Ratings & feedback | Pass (API) | Rating forms not clicked through the UI |

Real-UI lifecycle suite: **23/23**. Public pages / authentication UI: **27/27**. Dialogs, toasts, admin pages: **31/31**.

---

## 6. Responsive Testing

| Device | Result | Issues |
|---|---|---|
| Desktop 1920 | Pass (98 pages) | none |
| Desktop 1440 | Pass (98 pages) | none |
| Laptop 1366 | Pass (98 pages) | none |
| Tablet 768 | Pass (98 pages; screenshots reviewed) | dashboards use the compact top menu at this width (design choice) |
| Mobile 430 | Pass (98 pages) | native checkboxes/radios under 30px (labels are tappable) |
| Mobile 375 | Pass (98 pages) | same as above |
| Modals (7 kinds at 768 / 430 / 375 / 375×600) | Pass (28/28) | none |

Checks per page: horizontal overflow, content escaping the viewport, broken images, page errors, failed API calls, stuck skeletons, text under 11px, tap targets. Browser: Chrome with emulated screen sizes only.

---

## 7. Bugs Fixed

### Security (highest priority)
1. **Anyone could read or change other customers' orders, bookings, ratings and reports.**
   *Root cause:* routes had no authentication and trusted IDs from the URL/body. *Files:* `routes/orderRoutes.js`, `bookingRoutes.js`, `paymentRoutes.js`, `ratingRoutes.js`, `reportRoutes.js`, `notificationRoutes.js`, controllers for each, new `utils/access.js`. *Fix:* login required; ownership derived from the JWT; admin/vendor/partner exceptions explicit. *Verified:* 75-check suite.
2. **Razorpay payments were never verified server-side; anyone could create a "paid" order.**
   *Root cause:* `createRazorpayPaidOrder` trusted client-supplied payment IDs; the paid amount was chosen by the client. *File:* `controllers/orderController.js`. *Fix:* HMAC signature verification, plus the Razorpay order amount must equal the server-calculated total. *Verified:* forged signature rejected; and the full success path was verified with a real Razorpay test-mode checkout payment (see section 8).
3. **Delivery OTP was returned to vendors and delivery partners** (defeating its purpose). *Fix:* only the customer and admin receive it; hidden entirely once delivered. *Verified.*
4. **Notification routes were open** (any caller could read any customer's OTP notification). *Fix:* authentication + ownership. Duplicate notifications prevented with a unique index and upsert. OTP now generated with `crypto.randomInt`.
5. **`backend/.gitignore` was empty**, so `.env` (database URI, JWT secret, Razorpay/Cloudinary/email credentials) would be committed to GitHub. *Fix:* proper `.gitignore` plus a keys-only `.env.example`.

### Functional
6. **Products stayed "Out of Stock" after restocking.** *Root cause:* selling out sets `available=false`, and the edit form re-sent the old `false`. *File:* `controllers/productController.js`. *Fix:* restock from zero re-enables the product; zero stock always means unavailable; activating a zero-stock item returns a clear error; manual deactivation still respected. *Verified.*
7. **Negative or non-numeric price/stock returned a 500 error** on create and edit. *Fix:* shared validation → clear 400 messages. *Verified.*
8. **A booking dated in the past (2001) was accepted.** *File:* `controllers/bookingController.js`. *Fix:* rejected with 400. *Verified.*
9. **10 model imports had wrong capitalisation** (would crash on Linux). Corrected in 7 backend files (`adminController`, `orderController`, `productController`, `ratingController`, `reportController`, `vendorController`, `adminMiddleware`); all backend and 426 frontend imports re-checked.
10. **Customer notification feature** (from the first task): delivery-assigned notification with real partner name/phone, OTP and configurable ETA (`DELIVERY_ETA_MIN_MINUTES` / `MAX`), expandable card in the bell, 30-second polling.

### UI
11. Sidebar left an empty white column when scrolling long pages → sticky sidebar.
12. Vendor/delivery sidebar brand lost its styles (my regression) → restored.
13. Mobile menu hid the active tab and had no scroll hint; signed-in navbar used two rows; stat cards one per row; admin tables squeezed; product buttons wrapped; hidden file input caused horizontal scroll; empty delivery header → all fixed.
14. Tiny or dead vendor/product images left blank blocks or broken icons → `SafeImage` fallback.
15. Small tap targets on phones (28 page-loads) → 36–40px minimum (6 remaining are native checkboxes/radios).
16. Booking form was always open → now opens from a "Book This Chef" dialog.
17. Nine browser `confirm()` popups → styled confirm dialog; new Toast, Skeleton, Badge, EmptyState components; tokens aligned to your palette.

*Process note:* once during this work I introduced missing imports in My Orders (`ClipboardList`, `Link`) that the bundler did not flag. I caught it by re-checking imports before opening the page; the final browser sweeps confirm none remain.

---

## 8. Remaining Issues / Not Verified

**Needs you**
- **Password-reset flow** (needs a working email account).
- **Cloudinary uploads** (vendor/home-chef registration, product images, store image, food-rescue image).
- **Push to GitHub only after** confirming `backend/.env` is untracked (`git status`). If it was ever pushed, rotate the JWT secret, Razorpay, Cloudinary and email credentials.

**Payments (verified in Razorpay test mode, 2026-09-26)**
- Full path passed: cart → Razorpay Checkout (test card) → signature verified server-side → Razorpay order amount checked against the server total → paid order created → My Orders. 14/14 API checks and 9/9 real-checkout checks.
- **Gap found:** cancelling a *paid* Razorpay order restores stock and cancels the delivery, but the backend never issues a refund through Razorpay and the order keeps `paymentStatus: "paid"`. Refunds must be done manually in the Razorpay dashboard, or a refund call needs to be added.
- Low risk: a Razorpay order is not bound to the customer who created it (a leaked order id + payment id + signature could be claimed by another account). Adding the customer id to the Razorpay order `notes` and checking it at order creation would close this.

**Decisions for you**
- A customer can cancel an order even when it is Ready or Out for Delivery (stock returns, delivery cancelled). Blocked only for Delivered / Rejected / Cancelled.
- Home chefs share the vendor dashboard (no dedicated one). The brief's "Settings" and vendor/delivery "Notifications" pages do not exist in the application; only customer notifications are implemented.
- CORS is open to all origins and there is no rate limiting or validation library (the JWT and role checks are enforced, but this should be tightened before public deployment).

**Known, low risk**
- 11 lint warnings (`set-state-in-effect`), 0 errors.
- Two customers ordering the last unit at the same instant was not tested (concurrency was tested for food rescue only).
- Real-time notifications are polling (30 s), not push.
- Tests were run in Chrome with emulated screen sizes; Safari/iOS and real devices were not tested.
- The automated test scripts live outside the project (they use a headless browser and write tagged test data to the real database); they were not added to the repository.
