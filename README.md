# Mangodo Chat

Next.js (App Router) + MongoDB + Socket.IO ile gerçek-zamanlı sohbet uygulaması.  
Kayıt & e-posta doğrulama, JWT oturum, rate-limit, oda bazlı sohbet, “typing”, optimistik mesaj gönderimi ve sayfalanmış mesaj geçmişi içerir.

---

## İçindekiler
- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Çalıştırma](#çalıştırma)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Dizin Yapısı](#dizin-yapısı)
- [Temel Akış](#temel-akış)
- [Önemli API Uçları](#önemli-api-uçları)
- [Rate Limit](#rate-limit)
- [Geliştirme Notları](#geliştirme-notları)

---

## Özellikler

- **Kimlik Doğrulama**
  - Kayıt → e-posta doğrulama (Ethereal ile önizleme)
  - Giriş/Çıkış (JWT httpOnly cookie)
  - Doğrulama sonlandırma: `/verify=...`
  - `verify` istekleri otomatik `/verify`’e yönlenir

- **Sohbet**
  - Oda listesi (`/rooms`) + yeni oda oluşturma (`/rooms/new`)
  - Oda ekranı (`/rooms/[roomId]`)
    - Sonsuz scroll/sayfalama (SWR Infinite)
    - Gün ayıracı (“Bugün / Dün”)
    - Optimistik mesaj gönderimi; hata olursa geri alır
    - “X yazıyor…” göstergesi (kendime gösterilmiyor)
    - Online üyeler listesi (oda içi presence)
    - Geri butonu

- **Profil/Ayarlar**
  - Ad/Avatar güncelleme
  - Şifre değiştirme (mevcut + yeni)

- **Diğer**
  - Login/Register uçlarında IP + endpoint bazlı **rate-limit**
  - Üretime uygun güvenlik varsayılanları (httpOnly, SameSite, secure vs.)

---

## Teknolojiler

- **Next.js 15** (App Router)
- **MongoDB** & **Mongoose**
- **Socket.IO** (server & client)
- **SWR** (SWR Infinite)
- **Zod**, **bcryptjs**, **jsonwebtoken**
- Basit CSS yardımcı sınıflar (Tailwind)

---

## Kurulum

bash

# Bağımlılıklar
pnpm i    # veya npm i / yarn

---

## Ortam Değişkenleri

# Uygulama tabanı (geliştirmede zorunlu değil ama yönlendirmelerde kullanışlı)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Mongo
MONGODB_URI=mongodb://127.0.0.1:27017/mangodo-chat

# JWT
JWT_SECRET=supersecret_change_me

---

## Çalıştırma

pnpm dev      # http://localhost:3000
# prod
pnpm build && pnpm start

---

## Dizin Yapısı

src/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ login/route.ts
│  │  │  ├─ logout/route.ts
│  │  │  ├─ register/route.ts
│  │  │  └─ verify/route.ts
│  │  ├─ me/route.ts
│  │  └─ rooms/
│  │     ├─ [roomId]/messages/route.ts
│  │     └─ route.ts
│  ├─ login/page.tsx
│  ├─ register/page.tsx
│  ├─ rooms/
│  │  ├─ [roomId]/page.tsx
│  │  └─ new/page.tsx
│  ├─ settings/page.tsx
│  ├─ verify/page.tsx
│  ├─ favicon.ico
│  ├─ global.css
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
│
├─ components/
│  ├─ ChatRoom.tsx
│  ├─ LogoutButton.tsx
│  ├─ SettingsPasswordForm.tsx
│  ├─ SettingsProfileForm.tsx
│  └─ TopNav.tsx
│
├─ lib/
│  ├─ api.ts
│  ├─ auth-guard.ts
│  ├─ db.ts
│  ├─ email.ts
│  ├─ models.ts
│  ├─ rateLimit.ts
│  └─ session.ts
│
└─ pages/
   └─ api/
      └─ socketio.ts  # Socket.IO endpoint (Next.js pages API)

## Temel Akış

Kayıt (/register): Form → /api/auth/register

Başarılı olursa /verify?email=...&p=<previewUrl> sayfasına yönlendiririm.

Doğrulama (/verify):

E-postadaki link → /verify=... → /api/auth/verify=... POST

Başarılıysa giriş yapabilirim.

Giriş (/login): /api/auth/login

Dashboard (/app): Karşılama kartı → odalar/profil/çıkış

Odalar (/rooms): Liste + “Yeni Oda”

Oda (/rooms/[roomId]): Mesaj geçmişi (sayfalanmış), yazma alanı, typing, online üyeler

Ayarlar (/settings): Ad/Avatar, Şifre değişimi

---

## Önemli Api Uçları

POST /api/auth/register – Kayıt (rate-limit)

POST /api/auth/login – Giriş (rate-limit)

POST /api/auth/logout – Çıkış

POST /api/auth/verify=... – E-posta aktivasyonu

GET /api/me – Oturum sahibi

PATCH /api/me – Profil/şifre (uygulamada form uçları ayrıştırılmış)

GET /api/rooms – Oda listesi

GET /api/rooms/:roomId/messages?cursor=&limit= – Mesaj sayfalama

WS /api/socketio – Socket.IO (join_room, typing, send_message)

---

## Rate Limit

src/lib/rateLimit.ts ile token-bucket yaklaşımı:

Anahtar: IP + pathname (yüksek seviyede rateLimitReq(req, { limit, window }))

Başlıklar:

X-RateLimit-Limit

X-RateLimit-Remaining

X-RateLimit-Reset (saniye)

Geliştirmede in-memory saklama kullanıyorum.

## Geliştirme Notları

Private oda sadece etiket olarak gösteriliyor. Gerçek erişim kontrolü (oda üyeliği/ACL) gerekirse:

-  Oda modeline members: ObjectId[]

-  GET /rooms/:id/messages ve socket.join_room içinde üye kontrolü

-  Davet/katılım uçları

Rate-limit için prod ortamında Redis önerilir.

Avatar için URL yerine dosya yükleme eklenebilir.

Prod e-posta için gerçek SMTP sağlayıcısı kullanılmalı.

E2E (Playwright) ve API testleri eklenebilir.
