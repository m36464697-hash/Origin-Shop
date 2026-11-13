# Origin Shop — متجر الطلبات الرقمية والمنتجات العادية

متجر إلكتروني متكامل مبني بـ **React + TypeScript + Vite + Tailwind CSS** مع قاعدة بيانات ومصادقة **Firebase (Firestore & Google Auth)** ولوحة تحكم شاملة لإدارة الطلبات والمنتجات وواجهة المتجر.

---

## المحتويات
1. [متطلبات التشغيل المحلي](#1-متطلبات-التشغيل-المحلي)
2. [إعدادات `vite.config.ts` لـ GitHub Pages](#2-إعدادات-viteconfigts-اللازمة-لـ-github-pages)
3. [خطوات النشر على GitHub Pages خطوة بخطوة](#3-خطوات-النشر-على-github-pages-خطوة-بخطوة)
4. [خطوات النشر على Render (مجاني وسريع)](#4-خطوات-النشر-على-render-مجاني-وسريع)
5. [ضبط متغيرات البيئة وتأمين مفاتيح API](#5-ضبط-متغيرات-البيئة-وتأمين-مفاتيح-api-في-github-actions)
6. [إعداد Firebase بعد النشر (خطوة إلزامية)](#6-إعداد-firebase-بعد-النشر-خطوة-إلزامية)
7. [حل الأخطاء الشائعة في النشر](#7-حل-الأخطاء-الشائعة-في-النشر)

---

## 1. متطلبات التشغيل المحلي

تأكد من تثبيت **Node.js (الإصدار 20.19+ أو 22 LTS)** على جهازك، ثم نفّذ الأوامر التالية:

```bash
# 1. تثبيت الحزم
npm install

# 2. تشغيل خادم التطوير محلياً
npm run dev

# 3. التحقق من الأنواع البرمجية
npm run lint

# 4. بناء نسخة الإنتاج داخل مجلد dist/
npm run build
```

---

## 2. إعدادات `vite.config.ts` اللازمة لـ GitHub Pages

عند نشر تطبيق Vite على **GitHub Pages**، يُنشر الموقع غالباً على مسار فرعي مثل:
`https://USERNAME.github.io/REPO_NAME/` وليس على الجذر `/` مباشرة.

إذا كانت المسارات في `vite.config.ts` تشير إلى الجذر `/assets/...`، فستفشل ملفات JavaScript والصور في التحميل (خطأ `404`). لذلك يجب ضبط خاصية `base` في ملف `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // الخيار المرن: './' يعمل تلقائياً سواء على مسار فرعي /origin-shop/ أو على دومين مخصص
    base: './',
    // أو يمكنك تحديد اسم المستودع صراحةً عند الحاجة:
    // base: '/origin-shop/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
```

> **ملاحظة:** تم ضبط `base: './'` بالفعل في هذا المشروع، وكذلك تحويل مسارات الشعار والأيقونات (`./origin-logo.png`) لتعمل بنجاح على GitHub Pages دون تعديل إضافي.

---

## 3. خطوات النشر على GitHub Pages خطوة بخطوة

تم تجهيز ملف النشر التلقائي مسبقاً في المسار:
`.github/workflows/deploy.yml`

### الخطوة 1: إنشاء مستودع ورفع الكود إلى GitHub
أنشئ مستودعاً جديداً على GitHub (مثلاً باسم `origin-shop`) ثم نفّذ الأوامر التالية داخل مجلد المشروع:

```bash
git init
git add .
git commit -m "Initial commit: Origin Shop"
git branch -M main
git remote add origin https://github.com/USERNAME/origin-shop.git
git push -u origin main
```
*(استبدل `USERNAME` باسم حسابك على GitHub، و`origin-shop` باسم المستودع).*

### الخطوة 2: تفعيل GitHub Pages عبر GitHub Actions
1. افتح المستودع على موقع GitHub.
2. انتقل إلى **Settings** (الإعدادات) ← **Pages** من القائمة الجانبية.
3. تحت **Build and deployment**، في خانة **Source** اختر:
   **`GitHub Actions`** (وليس `Deploy from a branch`).
4. انتقل إلى تبويب **Actions** في المستودع؛ ستجد مهمة **`Deploy Origin Shop to GitHub Pages`** تعمل تلقائياً (أو اضغط **Run workflow** لتشغيلها يدوياً).
5. بعد انتهاء التشغيل بنجاح (علامة خضراء ✓)، سيظهر رابط موقعك المباشر داخل صفحة **Settings > Pages** وفي خطوة `deploy` داخل الـ Workflow.

---

## 4. خطوات النشر على Render (موقعان منفصلان للأمان والخصوصية)

تم فصل المشروع معمارياً إلى موقعين مستقلين تماماً يتشاركان نفس قاعدة بيانات Firebase:
1. **واجهة المتجر العامة (`dist/`)**: للعملاء فقط — خالية تماماً من أي كود أو أزرار تخص لوحة التحكم.
2. **بوابة الإدارة المستقلة (`dist-admin/`)**: موقع خاص وسري لا يفتح إلا بحساب Google المعتمد للإدارة (`m36464697@gmail.com`) وموسوم بـ `noindex, nofollow` لمنع أرشفته في محركات البحث.

### الطريقة الأسرع (عبر Blueprint):
1. ارفع التحديثات إلى مستودعك على GitHub.
2. سجّل دخولك إلى **[Render](https://render.com)** باستخدام حساب GitHub.
3. من لوحة التحكم اضغط **New +** ← اختر **Blueprint**.
4. اختر مستودع **Origin Shop**؛ سيتعرف Render تلقائياً على ملف `render.yaml` وينشئ الخدمتين:
   - **`origin-shop`** (المتجر العام): `npm run build` ← مجلد النشر `dist`
   - **`origin-shop-admin`** (لوحة التحكم الخاصة): `npm run build:admin` ← مجلد النشر `dist-admin`
5. اضغط **Apply** وخلال دقيقة ستحصل على رابطين منفصلين.

### أو إنشاء موقع الإدارة يدوياً (Static Site جديد):
إذا نشرت المتجر مسبقاً وتريد إضافة موقع لوحة التحكم الخاص به من نفس المستودع:
1. في Render اضغط **New +** ← **Static Site** واختر نفس مستودع **Origin Shop**.
2. اختر اسماً سرياً لا يسهل تخمينه للرابط (مثلاً `origin-ops-portal-xxxx`).
3. أدخل إعدادات البناء التالية:
   - **Build Command:** `npm run build:admin`
   - **Publish Directory:** `dist-admin`
4. (اختياري) في **Environment Variables** أضف:
   - `VITE_STOREFRONT_URL` = رابط متجرك العام (مثلاً `https://origin-shop.onrender.com`) ليعمل زر **"فتح المتجر"** داخل لوحة التحكم.
5. بعد الإنشاء ادخل إلى **Redirects/Rewrites** وأضف قاعدة:
   - **Source:** `/*` | **Destination:** `/index.html` | **Action:** `Rewrite`
6. **خطوة إلزامية لتسجيل الدخول:** انسخ رابط موقع الإدارة الجديد وأضفه في **Firebase Console ← Authentication ← Settings ← Authorized domains**.

---

## 5. ضبط متغيرات البيئة وتأمين مفاتيح API في GitHub Actions

### أ) القاعدة الذهبية لتأمين مفاتيح API في المواقع الثابتة (GitHub Pages)
تطبيقات **GitHub Pages** هي مواقع واجهة أمامية ثابتة (**Static Client-Side**)، أي أن كل متغير يبدأ بـ `VITE_` يتم دمجه داخل ملفات JavaScript التي ينزلها متصفح الزائر:

| نوع المفتاح | أين يُحفظ؟ | هل يصلح وضعه مع `VITE_` في GitHub Pages؟ | طريقة الحماية الصحيحة |
| :--- | :--- | :--- | :--- |
| **مفاتيح سرية خاصة** (مثل `GEMINI_API_KEY`، مفاتيح Stripe السرية، أسرار OAuth) | في **خادم خلفي (Backend)** مثل Cloud Run أو Firebase Functions + GitHub Secrets | **لا — ممنوع نهائياً** لأن أي زائر يستطيع قراءتها من المتصفح | تبقى على السيرفر فقط ولا تُمرر أبداً للواجهة الأمامية |
| **إعدادات عميل Firebase** (`apiKey`, `projectId`, `appId`) | في `firebase-applet-config.json` أو متغيرات `VITE_FIREBASE_*` | **نعم** (مصممة للعمل من المتصفح) | تُؤمَّن عبر **`firestore.rules`** + تقييد المفتاح في Google Cloud Console بمواقعك فقط (**HTTP Referrers**) + تفعيل **Authorized Domains** |

> **ملاحظة:** في هذا المشروع، تم فحص الكود ولا توجد أي مفاتيح AI سرية مكشوفة في الواجهة الأمامية؛ متجر **Origin Shop** يعتمد فقط على إعدادات عميل Firebase المحمية بقواعد أمان `firestore.rules`.

---

### ب) خطوات إضافة متغيرات البيئة والأسرار في GitHub
إذا أردت تمرير إعدادات بيئة لعملية البناء في GitHub Actions (أو مفاتيح خلفية لاحقاً):

1. افتح مستودعك على GitHub وانتقل إلى:
   **Settings** ← **Secrets and variables** ← **Actions**
2. أضف المتغيرات في التبويب المناسب:
   - للمفاتيح الحساسة (Secrets): تبويب **Secrets** ← اضغط **New repository secret**.
   - للإعدادات العامة غير الحساسة (مثل رابط الموقع): تبويب **Variables** ← اضغط **New repository variable**.
3. مثال لربطها داخل `.github/workflows/deploy.yml`:

```yaml
      - name: Build production bundle
        env:
          VITE_APP_URL: ${{ vars.VITE_APP_URL }}
          # مثال إذا استخدمت متغيرات Vite للعميل من GitHub Secrets:
          # VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        run: |
          npm run build
          touch dist/.nojekyll
```

4. **تقييد مفتاح Firebase في Google Cloud (حماية إضافية مُوصى بها قبل النشر):**
   - افتح **Google Cloud Console** ← **APIs & Services** ← **Credentials**.
   - اختر مفتاح المتصفح (**Browser key**) الخاص بمشروع Firebase.
   - من **Application restrictions** اختر **Websites** وأضف روابط المتجر ولوحة الإدارة الخاصة بك فقط:
     `https://origin-shop.onrender.com/*` ورابط الإدارة الخاص بك.

---

## 6. إعداد Firebase بعد النشر (خطوة إلزامية)

بعد الحصول على رابط المتجر ورابط لوحة التحكم المستقلة على Render أو GitHub Pages، لن يعمل تسجيل الدخول بحساب Google إلا بعد اعتماد النطاقات في Firebase:

1. افتح **[Firebase Console](https://console.firebase.google.com/)** واختر مشروعك.
2. انتقل إلى **Authentication** ← **Settings** ← **Authorized domains**.
3. اضغط **Add domain** وأضف **كلاً من**:
   - نطاق المتجر العام (مثلاً `origin-shop.onrender.com`).
   - نطاق بوابة الإدارة الخاصة (مثلاً `origin-shop-admin.onrender.com`).
4. لا يمكن لأي حساب Google آخر فتح بوابة الإدارة أو التعديل على قاعدة البيانات؛ الوصول مقيد بالبريد الإداري المعتمد في `firestore.rules` وداخل البوابة.

---

## 7. حل الأخطاء الشائعة في النشر

- **خطأ `Dependencies lock file is not found` أو فشل `npm ci` في GitHub Actions:**
  - يحدث لأن المشروع يستخدم `bun.lock` ولا يحتوي على `package-lock.json` عند تحميله من البداية.
  - تم إصلاح ذلك بالفعل في `.github/workflows/deploy.yml` ليتحقق تلقائياً: إذا وُجد `package-lock.json` يستخدم `npm ci`، وإلا يستخدم `npm install --legacy-peer-deps`.
- **خطأ `404` للصور أو ملفات JS عند فتح الرابط:**
  - تأكد من وجود `base: './'` في `vite.config.ts` و`vite.admin.config.ts` ووجود ملف `.nojekyll` داخل مجلد البناء `dist/` عند النشر على GitHub Pages.
- **خطأ `auth/unauthorized-domain` عند تسجيل الدخول بـ Google:**
  - تأكد من إضافة نطاق الموقع (المتجر وكذلك موقع الإدارة المنفصل) في **Firebase Console > Authentication > Settings > Authorized domains**.
- **الصفحة تفتح ولكن المنتجات المحدثة لا تظهر من السحابة:**
  - افتح بوابة الإدارة المستقلة وسجّل الدخول بحساب Google الإداري المعتمد (`m36464697@gmail.com`) حتى تتزامن المنتجات وإعدادات الواجهة مباشرة مع Cloud Firestore.
