# Leelavati Hospital - Multispecialty Healthcare Portal & Admin Backend

A full-stack healthcare web application with an integrated **Administration Control Panel**, **Complete Image Management across Every Single Tab**, **Permanent Disk Persistence**, **Dynamic Environment-Based (.env) Authentication**, and **Online & Walk-In Appointment Management**.

---

## 🚀 Quick Start

### 1. Start the Server
Make sure Python is installed, then run:
```bash
python app.py
```

### 2. Access the Application
- **🌐 Public Website:** [http://localhost:5000/](http://localhost:5000/)
- **🔐 Admin Login:** [http://localhost:5000/admin/login](http://localhost:5000/admin/login)
- **📊 Admin Dashboard:** [http://localhost:5000/admin](http://localhost:5000/admin)

---

## 🖼️ Image Management in Every Single Tab (Change, Upload, Remove, Update)

Every single section and tab has full, live visual management with 4 dedicated actions:
1. **Upload File:** Select any image (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.gif`) from your computer for instant upload and preview.
2. **Change / URL Input:** Paste an external image URL or local `/uploads/...` URL with instant live thumbnail preview.
3. **Remove / Revert:** 1-click removal that automatically reverts the section to a clean, modern SVG illustration, initials badge, or icon graphic.
4. **Live Image Strip on Cards:** Services, Doctors, and Testimonial cards feature quick image controls directly on the dashboard cards without opening extra dialogs.

### Tab-by-Tab Visual & Functional Features

| Tab | Visual & Functional Options |
|---|---|
| **📊 Tab 1: Dashboard** | • **Site Visual Assets Central Hub**: Direct management grid for all 21 site visuals with live status badge ("Custom Active" vs "Default Graphic"), instant upload/change, and 1-click removal.<br>• Real-time counters, appointment stats, and quick-action shortcuts. |
| **📅 Tab 2: Appointments** | • **Walk-In Appointment Registration Modal**: Add offline/in-person hospital bookings with department select, date, time, and patient details.<br>• **Appointment Banner Image**: Upload / Change / Remove consultation graphic.<br>• Real-time filters (Pending, Confirmed, Completed, Cancelled), patient search, WhatsApp quick links, and JSON export. |
| **🏥 Tab 3: Branding** | • **Brand Logo Image**: Upload/change custom clinic logo.<br>• **Browser Favicon Image**: Upload/change tab favicon.<br>• **Top Announcement Bar**: Toggle banner on/off, customize banner message, and set optional icon visual.<br>• **Theme Accent Color Customizer**: Pick custom brand accent color.<br>• Clinic name, tagline, emergency hotline, contact numbers, email, and social links. |
| **🚀 Tab 4: Hero Section** | • **Hero Main Showcase Photo**: Upload/change high-resolution hospital hero visual.<br>• **Hero Background Pattern/Photo**: Customize hero backdrop visual.<br>• **Trust Badge Mini Avatar**: Custom doctor/nurse avatar for hero trust box.<br>• Headlines, subheadings, primary/secondary CTA buttons, floating rating pill, and bottom stat counters. |
| **ℹ️ Tab 5: About Hospital** | • **Main Facility Photo**: Hospital building/operation theatre photograph.<br>• **Medical Director / Founder Portrait**: High-res portrait photo.<br>• **Accreditation / Quality Badge Image**: NABH / ISO certification seal graphic.<br>• Section badges, story paragraphs, experience counter, and 3 core value cards. |
| **🩺 Tab 6: Services** | • **Services Section Banner Visual**: Department header accent banner.<br>• **Individual Specialty Card Photos**: Direct 1-click upload/change/remove photo strip on every service card + modal photo manager.<br>• **Booking Department Options Manager**: Add or remove medical departments available in the booking dropdown.<br>• Full Add/Edit/Delete capabilities for specialties. |
| **🌟 Tab 7: Why Choose Us** | • **Why Us Section Graphic**: Key hospital feature photo.<br>• **Quality & Patient Safety Award Seal**: Excellence badge graphic.<br>• Section badges, descriptions, patient satisfaction counter, and 3 benefit highlight cards. |
| **👨‍⚕️ Tab 8: Doctors Team** | • **Doctors Group Header Banner**: Medical staff visual header.<br>• **Doctor Card Portraits**: Direct 1-click photo upload/change/remove on every doctor card + doctor modal photo manager.<br>• Full Add/Edit/Delete for doctors (name, department, qualification, experience, rating, bio). |
| **💬 Tab 9: Patient Testimonials** | • **Testimonials Accent Banner**: Header visual banner.<br>• **Patient Avatar Photos**: Direct 1-click photo upload/change/remove on every testimonial card + modal avatar manager.<br>• Full Add/Edit/Delete for patient reviews (name, role, stars, review text). |
| **📞 Tab 10: Contact & Footer** | • **Hospital Map / Facility Photo**: Location photograph.<br>• **Reception & Entrance Photo**: Reception lounge visual.<br>• **UPI & WhatsApp QR Code Image**: Direct payment or quick appointment QR code.<br>• **Footer Accreditation / Partner Strip Visual**: Partner and certification logos.<br>• Address, hours, telephone, email, and footer copyright text. |
| **🔐 Tab 11: .env & Security** | • **SEO OpenGraph (OG) Social Share Visual**: Image shown when sharing website on WhatsApp, Twitter, Facebook, LinkedIn.<br>• **Admin Profile Avatar**: Custom profile photo for admin header.<br>• **Emergency Hospital Alert / Maintenance Banner**: Toggle emergency alert on public homepage.<br>• Live `.env` credentials manager and site defaults restore. |

---

## 💾 Permanent Persistence Architecture

- **Site Content Storage:** `data/site_content.json`
- **Appointments Storage:** `data/appointments.json`
- **Atomic File Writes:** All updates are written to temporary files first (`.tmp`) before atomic replacement. This eliminates partial writes or file corruption even during sudden server reboots or system crashes.
- **Server Restarts:** All admin updates, uploaded files, and appointments persist permanently on disk and remain active across reboots.

---

## 🔌 REST API Endpoints

### Public APIs
- `GET /api/content` — Fetch current site content JSON.
- `POST /api/appointments` — Book new appointment (validated and saved permanently).

### Protected Admin APIs (Session Required)
- `POST /api/admin/login` — Authenticate admin against dynamic `.env` credentials.
- `POST /api/admin/logout` — Terminate admin session.
- `GET /api/admin/check` — Verify session status.
- `POST /api/upload` — Upload visual asset (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.gif`).
- `DELETE /api/upload/<filename>` — Delete uploaded file.
- `POST /api/content` — Update full site content JSON permanently.
- `POST /api/content/reset` — Reset site content back to hospital defaults.
- `GET /api/appointments` — Fetch all booked appointments.
- `PATCH /api/appointments/<id>/status` — Update appointment status (`pending`, `confirmed`, `completed`, `cancelled`).
- `DELETE /api/appointments/<id>` — Delete appointment record.
- `GET /api/admin/env` — View `.env` credentials.
- `POST /api/admin/env` — Update `.env` username and password directly.

---

## 🧪 Automated Verification Suite

Run the comprehensive automated verification suite:
```bash
python scratch/verify_suite.py
```
Validates:
1. Public website and asset delivery.
2. Admin authentication and session handling.
3. Protected upload endpoint and file serving.
4. Live content updates and disk persistence.
5. Image removal and fallback mechanism.
6. Online and Walk-In appointment lifecycle.
