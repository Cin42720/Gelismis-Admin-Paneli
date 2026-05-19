# Tek Kisilik Yol Haritasi

## 1. Hafta - Temel Iskelet

- Docker Compose ile MySQL, RabbitMQ, Redis, backend, frontend, worker ve AI servislerini ayaga kaldir.
- MySQL tablo yapisini kur: gruplar, kullanicilar, ekranlar, izinler, JSON kayitlar, dosyalar, loglar.
- Ornek verileri ekle: supervisor, ogrenci, okul, isletme.
- Backend `health`, `screens`, `groups`, `permissions` endpointlerini calistir.

## 2. Hafta - Yetki ve Admin Panel

- Supervisor icin sol menulu admin paneli hazirla.
- Ekran atama ve CRUD izin formlarini tamamla.
- Grup bazli gorulebilir menuleri frontend'de uygula.
- Tum yetki degisikliklerini logla.

## 3. Hafta - Dosya Yukleme ve AI

- Grup bazli uzanti kontrolu ekle.
- Dosya metadata bilgisini MySQL'e yaz.
- AI servise dosya analizi endpointi ekle.
- `txt` prompt isleme ve Word -> HTML donusum akisini demo seviyesinde tamamla.

## 4. Hafta - RabbitMQ RPC ve Loglama

- CRUD islemlerini RabbitMQ'ya event olarak gonder.
- Worker tarafinda RPC cevap formatini tamamla.
- Basarili/basarisiz islemleri `app_logs` tablosuna yaz.
- Supervisor log ekranini frontend'e ekle.

## 5. Hafta - Test, Veri Ciktisi, Teslim

- `db/init/01_schema.sql` dosyasini final veritabani ciktisi olarak guncelle.
- README kurulum adimlarini ekran goruntuleriyle destekle.
- Docker ile sifirdan kurulum testi yap.
- GitHub'a yukle ve teslim linkini `GITHUB_LINK.txt` icine koy.

## MVP Oncelik Sirasi

1. Docker ile tum servislerin acilmasi.
2. Supervisor yetki atama paneli.
3. CRUD izinlerinin backend tarafinda uygulanmasi.
4. Dosya yukleme kisitlari.
5. RabbitMQ RPC ve log tablosu.
6. AI analiz demosu.
7. UI iyilestirme ve teslim dokumantasyonu.
