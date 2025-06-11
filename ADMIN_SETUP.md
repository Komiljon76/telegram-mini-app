# Admin Panel Sozlash Yo'riqnomasi

## 🔧 Admin Panel Xususiyatlari

### 👥 Foydalanuvchilar boshqaruvi
- **Barcha foydalanuvchilar ro'yxati** - Barcha bot foydalanuvchilarini ko'rish
- **Foydalanuvchi qidirish** - ID yoki username bo'yicha qidirish
- **Foydalanuvchini bloklash** - Foydalanuvchini bloklash
- **Blokni olib tashlash** - Bloklangan foydalanuvchini qayta faollashtirish

### 📊 Statistika
- **Umumiy statistika** - Foydalanuvchilar soni, faollik
- **Batafsil statistika** - Kunlik, haftalik, oylik ma'lumotlar
- **Grafik ko'rinish** - Vizual statistika

### 📢 Reklama yuborish
- **Barcha foydalanuvchilarga** - Barcha foydalanuvchilarga reklama
- **Faol foydalanuvchilarga** - Faqat faol foydalanuvchilarga
- **Kanallarga** - Qo'shilgan kanallarga reklama
- **Reklama tarixi** - Yuborilgan reklamalar tarixi

### 📺 Kanal boshqaruvi
- **Kanal qo'shish** - Yangi kanal qo'shish
- **Kanallar ro'yxati** - Barcha kanallarni ko'rish
- **Kanal tahrirlash** - Mavjud kanalni tahrirlash
- **Kanalni o'chirish** - Kanalni o'chirish

## 🚀 Sozlash qadamlari

### 1. Admin ID'sini o'rnatish
`admin_enhanced.py` faylida `ADMIN_IDS` ro'yxatiga o'z Telegram ID'ingizni qo'shing:

```python
ADMIN_IDS = [123456789]  # O'z ID'ingizni kiriting
```

**ID'ingizni qanday olish mumkin:**
1. @userinfobot ga yozing
2. Sizga ID'ingiz ko'rsatiladi

### 2. Bot'ni ishga tushirish
```bash
python admin_enhanced.py
```

### 3. Admin panel'ni ochish
Bot'ga `/admin` buyrug'ini yuboring

## 📋 Admin Panel Buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/admin` | Admin panel'ni ochish |
| `/cancel` | Har qanday amalni bekor qilish |

## 🔐 Xavfsizlik

- Faqat `ADMIN_IDS` ro'yxatidagi foydalanuvchilar admin panel'ga kirish huquqiga ega
- Barcha ma'lumotlar JSON fayllarda saqlanadi
- Har bir amal log qilinadi

## 📁 Ma'lumotlar fayllari

- `users_data.json` - Foydalanuvchilar ma'lumotlari
- `channels_data.json` - Kanallar ma'lumotlari  
- `ads_data.json` - Reklamalar tarixi
- `stats_data.json` - Statistika ma'lumotlari

## 🎯 Qo'shimcha xususiyatlar

### Foydalanuvchi ma'lumotlari
- ID, username, ism, familiya
- Ro'yxatdan o'tgan sana
- Oxirgi faollik vaqti
- Bloklash holati

### Reklama xususiyatlari
- Markdown formatlash qo'llab-quvvatlanadi
- Yuborish natijalari ko'rsatiladi
- Reklama tarixi saqlanadi

### Statistika
- Kunlik, haftalik, oylik ma'lumotlar
- Faol foydalanuvchilar soni
- Bloklangan foydalanuvchilar
- Faollik foizi

## ⚠️ Muhim eslatmalar

1. **Admin ID'sini to'g'ri o'rnating** - aks holda admin panel'ga kira olmaysiz
2. **Ma'lumotlar fayllarini zaxiraga oling** - muhim ma'lumotlar yo'qolib ketmasligi uchun
3. **Reklama yuborishda ehtiyot bo'ling** - foydalanuvchilarni bezovta qilmaslik uchun
4. **Bloklash funksiyasini oqilona ishlating** - faqat zarur hollarda

## 🆘 Yordam

Agar muammo yuzaga kelsa:
1. Log fayllarini tekshiring
2. Ma'lumotlar fayllarini tekshiring
3. Admin ID'sini qayta tekshiring
4. Bot'ni qayta ishga tushiring 