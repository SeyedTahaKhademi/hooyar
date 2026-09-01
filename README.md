# Hooyar (هویار) - AI Coding Agent

<div align="center">
  <img src="assets/hooyar.png" width="128" height="128" alt="Hooyar Logo">
  <h3>Elite Autonomous AI Coding Agent for Windows</h3>
  <p>ایجنت هوشمند و خودمختار برنامه‌نویسی برای ویندوز</p>

  [![GitHub Release](https://img.shields.io/github/v/release/seyedtahakhademi/hooyar?style=flat-square)](https://github.com/seyedtahakhademi/hooyar/releases)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
  [![Telegram](https://img.shields.io/badge/Telegram-Join%20Us-blue?style=flat-square&logo=telegram)](https://t.me/hooshamoozan)
</div>

---

## 🇮🇷 معرفی به فارسی (Persian)

**هویار** یک دستیار هوشمند و خودمختار برای برنامه‌نویسان است که به صورت مستقیم روی سیستم‌عامل ویندوز اجرا می‌شود. این ابزار با بهره‌گیری از قدرت مدل‌های زبانی بزرگ (LLMs)، به شما در نوشتن کد، مدیریت فایل‌ها و اجرای دستورات ترمینال کمک می‌کند.

### ✨ قابلیت‌های کلیدی
- **حلقه ایجنت خودمختار:** مدل ابزارها را فرامی‌خواند، نتایج واقعی را دریافت می‌کند و کار را تا رسیدن به پاسخ نهایی ادامه می‌دهد.
- **مدیریت هوشمند فایل‌ها:** خواندن، نوشتن و ویرایش مستقیم فایل‌های پروژه — کاملاً محدود به پوشه کاری شما (سندباکس).
- **جستجوی پوشه کاری:** جستجوی هم‌زمان در نام و محتوای فایل‌ها توسط ایجنت.
- **ترمینال داخلی:** اجرای دستورات PowerShell به صورت خودکار، با سقف زمانی ۱۲۰ ثانیه.
- **پشتیبانی از مدل‌های متنوع:** اتصال به Gemini، OpenAI، Claude، DeepSeek، Groq، Ollama و ۱۲+ سرویس دیگر.
- **امنیت داده:** کلیدهای API با `safeStorage` (DPAPI ویندوز) به‌صورت رمزنگاری‌شده ذخیره می‌شوند.
- **درخواست‌های امن:** تمام تماس‌های مدل از Main Process الکترون عبور می‌کنند (بدون غیرفعال‌سازی امنیت مرورگر).
- **نصب‌کننده Wizard:** دارای فایل نصب حرفه‌ای NSIS برای ویندوز.
- **رابط کاربری مدرن:** طراحی زیبا با پشتیبانی کامل از زبان فارسی و فونت وزیرمتن + خروجی Markdown از گفتگوها.
- **تایید خودکار (Auto-Approve):** امکان اجرای خودکار ابزارها — به‌صورت پیش‌فرض غیرفعال تا کنترل دست کاربر باقی بماند.

### 🔒 امنیت
- عملیات فایل‌سیستم فقط داخل پوشه کاری انتخاب‌شده مجاز است و مسیرهای خارج از آن مسدود می‌شوند.
- کلیدهای API رمزنگاری‌شده ذخیره می‌شوند و هرگز از رندرر به بیرون ارسال نمی‌شوند.
- رندرر ایجنت Sandbox شده و CSS/Scriptها با Content-Security-Policy محدود شده‌اند.
- جزئیات بیشتر و قوانین امنیتی برای توسعه‌دهندگان در [CONTRIBUTING.md](CONTRIBUTING.md).

### 🚀 نحوه استفاده
1. آخرین نسخه را از بخش [Releases](https://github.com/seyedtahakhademi/hooyar/releases) دانلود و نصب کنید.
2. کلید API ارائه‌دهنده مورد نظر خود را در تنظیمات وارد کنید (با «تست اتصال» فهرست مدل‌ها تازه می‌شود).
3. پوشه پروژه خود را انتخاب کرده و شروع به چت با هویار کنید!

---

## 🇬🇧 English Introduction

**Hooyar** is an elite autonomous AI Coding Agent built for Windows. It empowers developers by integrating advanced LLMs directly with their local workspace, enabling seamless code generation, file manipulation, and terminal execution.

### ✨ Key Features
- **Autonomous Agent Loop:** the model requests tools, receives real results, and keeps working until the task is done.
- **Sandboxed File System:** direct access to read, write, and modify files — strictly confined to your selected workspace folder.
- **Workspace Search:** the agent can search file names and contents across the project.
- **Integrated Terminal:** automatically executes PowerShell commands with a 120s timeout.
- **Multi-Provider Support:** Gemini, OpenAI, Claude, DeepSeek, Groq, local models (Ollama) and 12+ more.
- **Encrypted Secrets:** provider API keys are stored encrypted via Electron `safeStorage` (Windows DPAPI).
- **Secure Networking:** all model traffic is proxied through the Electron main process — `webSecurity` stays on.
- **Professional Installer:** user-friendly NSIS Wizard installer.
- **Modern UI:** sleek design with full RTL support, Vazirmatn font and Markdown chat export.
- **Auto-Approve Mode:** opt-in automatic tool execution for faster iteration.

### 🚀 How to Use
1. Download the latest `.exe` from the [Releases](https://github.com/seyedtahakhademi/hooyar/releases) section.
2. Enter your API Key in the Settings modal and run "Test Connection".
3. Select your workspace folder and start building!

---

## 🛠️ Development & Build (برای توسعه‌دهندگان)

If you want to run the project locally or build it yourself:
اگر می‌خواهید پروژه را به صورت محلی اجرا کنید یا خودتان بیلد بگیرید:

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Type-check
npx tsc --noEmit

# Build the Wizard Installer (.exe)
npm run dist
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the project structure and security rules before opening a pull request.

---

## 📢 Stay Connected (ارتباط با ما)

For updates, tutorials, and community support, join our Telegram channel:
برای دریافت آخرین اخبار، آموزش‌ها و پشتیبانی، به کانال تلگرام ما بپیوندید:

👉 **[t.me/hooshamoozan](https://t.me/hooshamoozan)**

---

<div align="center">
  Developed with ❤️ by <b>Seyed Taha Khademi</b> & Hooyar Team — released under the <a href="LICENSE">MIT License</a>.
</div>
