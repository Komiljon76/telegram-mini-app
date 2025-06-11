# 🚀 Job Mini App - Telegram Mini App

Zamonaviy va chiroyli ish o'rinlari platformasi. Telegram Mini App sifatida ishlaydi va barcha zamonaviy brauzerlarda ishlaydi.

## ✨ Xususiyatlar

### 🔐 Xavfsizlik
- **Telefon va parol bilan autentifikatsiya**
- **Avtomatik kirish** (doimiy yoniq)
- **Parolni tiklash** (SMS tasdiqlash)
- **Ikki bosqichli autentifikatsiya** (opsional)
- **Faollik kuzatish** va **sessiya boshqaruvi**

### 👥 Foydalanuvchi funksiyalari
- **Shaxsiy kabinet** - barcha ma'lumotlaringiz bir joyda
- **Profil tahrirlash** - ma'lumotlaringizni yangilang
- **Parol o'zgartirish** - xavfsizlik uchun
- **Kirish tarixi** - barcha kirishlarni ko'ring
- **Ma'lumotlarni yuklab olish** - JSON formatda
- **Akkauntni o'chirish** - to'liq ma'lumotlarni o'chirish

### 💼 Ish funksiyalari
- **Ishlarni qidirish** - minglab ish o'rinlari
- **Ish joylashtirish** - o'z ishingizni joylashtiring
- **Ishni tahrirlash** - mavjud ishlarni yangilang
- **Ishni o'chirish** - keraksiz ishlarni o'chiring
- **Ishga ariza** - bir tugmachada ariza topshiring

### 🎨 Dizayn
- **Zamonaviy glassmorphism** dizayn
- **Qorong'i gradient** ranglar sxemasi
- **Responsive** - telefon va kompyuter uchun
- **Animatsiyalar** - chiroyli o'tishlar
- **Loading screen** - yuklanish animatsiyasi

### ⚙️ Sozlamalar
- **Bildirishnomalar** - yangi ishlar haqida
- **Qorong'i rejim** - ko'zni saqlash uchun
- **Avtomatik kirish** - tez kirish uchun
- **Faollik kuzatish** - barcha harakatlarni qayd etish

## 🛠️ Texnologiyalar

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)
- **Security**: Helmet, CORS, Rate Limiting

## 📦 O'rnatish

### Talablar
- Node.js 16.0.0 yoki undan yuqori
- npm 8.0.0 yoki undan yuqori

### Qadamlar

1. **Loyihani yuklab oling**
```bash
git clone https://github.com/your-username/job-mini-app.git
cd job-mini-app
```

2. **Dependency'larni o'rnating**
```bash
npm install
```

3. **Serverni ishga tushiring**
```bash
# Development uchun
npm run dev

# Production uchun
npm start
```

4. **Brauzerda oching**
```
http://localhost:3000
```

## 🌐 Tarmoqda ochish

Serverni ishga tushirganingizdan so'ng, telefon orqali kirish uchun:

1. **Kompyuteringizning IP manzilini toping**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

2. **Telefon orqali kirish**
```
http://[COMPUTER_IP]:3000
```

**Eslatma**: Kompyuter va telefon bir xil Wi-Fi tarmog'ida bo'lishi kerak.

## 📱 Telegram Mini App sifatida ishlatish

1. **Telegram Bot API** orqali bot yarating
2. **Mini App** qo'shing va URL manzilini ko'rsating
3. **Web App** sifatida ishga tushiring

## 🔧 Sozlamalar

### Environment Variables
```env
PORT=3000
NODE_ENV=production
```

### Production Deployment
```bash
# PM2 bilan
npm install -g pm2
pm2 start server.js --name "job-mini-app"

# Docker bilan
docker build -t job-mini-app .
docker run -p 3000:3000 job-mini-app
```

## 📁 Fayl strukturasi

```
job-mini-app/
├── index.html          # Asosiy HTML fayl
├── style.css           # CSS stillar
├── script.js           # JavaScript logika
├── server.js           # Express server
├── package.json        # NPM konfiguratsiya
├── README.md           # Hujjat
└── assets/             # Rasmlar va fayllar
    ├── icons/
    └── images/
```

## 🎯 API Endpoints

- `GET /` - Asosiy sahifa
- `GET /health` - Server holati
- `GET /api/status` - API holati

## 🔒 Xavfsizlik

- **Helmet** - XSS va boshqa hujumlardan himoya
- **CORS** - Cross-origin so'rovlarni boshqarish
- **Rate Limiting** - DDoS hujumlarini oldini olish
- **Content Security Policy** - XSS hujumlarini oldini olish

## 🚀 Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Heroku
```bash
heroku create
git push heroku main
```

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## 🐛 Xatoliklarni tuzatish

### Umumiy muammolar

1. **Port 3000 band**
```bash
# Boshqa port ishlatish
PORT=3001 npm start
```

2. **CORS xatosi**
```bash
# server.js da CORS sozlamalarini tekshiring
```

3. **Telefon orqali kirish ishlamaydi**
```bash
# Firewall sozlamalarini tekshiring
# Antivirus dasturlarni o'chiring
```

## 🤝 Hissa qo'shish

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/amazing-feature`)
3. O'zgarishlarni commit qiling (`git commit -m 'Add amazing feature'`)
4. Branch'ga push qiling (`git push origin feature/amazing-feature`)
5. Pull Request yarating

## 📄 Litsenziya

Bu loyiha MIT litsenziyasi ostida tarqatilgan. Batafsil ma'lumot uchun `LICENSE` faylini ko'ring.

## 📞 Aloqa

- **Email**: support@jobminiapp.com
- **Telegram**: @jobminiapp_support
- **Website**: https://jobminiapp.com

## 🙏 Minnatdorchilik

- **Font Awesome** - Ikonlar uchun
- **Google Fonts** - Inter shrifti uchun
- **Express.js** - Backend framework uchun
- **Telegram** - Mini App platformasi uchun

---

⭐ Bu loyihani yaxshi ko'rsangiz, yulduzcha bering! 