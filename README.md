# Gelişmiş Admin Paneli

Docker tabanlı, mikroservis mimarisine sahip esnek ve gelişmiş bir rol tabanlı admin paneli projesidir. Sistem, farklı kullanıcı grupları (süpervizör, öğrenci, okul, işletme vb.) için dinamik ekran atama ve ince ayarlı CRUD yetkilendirme altyapısı sunar. Modern web teknolojileri, asenkron mesajlaşma kuyrukları ve AI entegrasyonu ile ölçeklenebilir bir yapıya sahiptir.

## Kullanılan Teknolojiler

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** FastAPI (Python)
- **Mesajlaşma:** RabbitMQ (RPC cevap kuyruğu mantığı ile)
- **Veritabanı:** MySQL (Temel tablolar + `JSON` kolonları ile esnek veri modeli)
- **Önbellek:** Redis
- **AI Servis:** FastAPI tabanlı ayrı bir mikroservis; RAG/MCP entegrasyonu için yapılandırılmış
- **Altyapı:** Docker Compose

## Roller ve Yetkilendirme

Sistemde yetkilendirme tamamen dinamiktir:

- `supervisor` (Süpervizör): Tüm sistemin yöneticisidir. Diğer grupların erişebileceği ekranları atar/çıkarır ve her ekran için özel yetkileri (Oluşturma, Okuma, Güncelleme, Silme, Dosya Yükleme) belirler.
- `student`, `school`, `company` vb.: Kendi gruplarına özel olarak süpervizör tarafından atanmış yetki ve ekranları kullanırlar.

## Demo Giriş Bilgileri

Frontend açılışında bir login ekranı sizi karşılar. Geliştirme ve test ortamı için sisteme önceden tanımlanmış demo kullanıcıları şunlardır:

```text
Süpervizör:
  E-posta: supervisor@example.com
  Şifre: 123456

Öğrenci:
  E-posta: ogrenci@example.com
  Şifre: 123456

Okul:
  E-posta: okul@example.com
  Şifre: 123456

İşletme:
  E-posta: isletme@example.com
  Şifre: 123456
```

## Proje Mimarisi

```text
backend/       Ana API; yetkilendirme, veri yönetimi, dosya ve AI proxy işlemleri
frontend/      React ve Tailwind tabanlı modern kullanıcı arayüzü
worker/        RabbitMQ üzerinden çalışan asenkron görev ve loglayıcı consumer
ai-service/    Dosya analizi, format dönüşümü ve RAG/MCP entegrasyon servisi
db/init/       MySQL şemaları, trigger, function, procedure ve örnek veriler
docs/          Mimari dokümanlar ve proje notları
logs/          Sistem ve asenkron işlem logları
```

## Kurulum ve Çalıştırma

Projeyi lokalinizde çalıştırmak için Docker ve Docker Compose'a ihtiyacınız vardır.

1. Ortam dosyasını kopyalayarak hazırlayın:

```bash
cp .env.example .env
```

2. Tüm servisleri Docker ile başlatın:

```bash
docker compose --env-file .env up --build -d
```

> **Windows Kullanıcıları İçin Not:** Docker Desktop yeni kurulduysa ve PowerShell `docker` komutunu tanımıyorsa, yeni bir terminal açarak devam edin.
> Eski veritabanı verilerini temizleyip sıfırdan kurulum yapmak isterseniz: `docker compose down -v` ardından tekrar `up` komutunu kullanabilirsiniz.

3. Sistem ayağa kalktığında aşağıdaki adreslerden servislere erişebilirsiniz:

- **Frontend Paneli:** `http://localhost:3001`
- **Backend API Docs (Swagger):** `http://localhost:8000/docs`
- **AI Servis Docs (Swagger):** `http://localhost:8100/docs`
- **RabbitMQ Yönetim Paneli:** `http://localhost:15672` (Kullanıcı adı: `guest` / Şifre: `guest`)
- **MySQL Veritabanı:** `localhost:3306`

4. MySQL bağlantı bilgisi (`.env` varsayılanları):

```text
Host: 127.0.0.1
Port: 3306
Database: admin_panel
Root kullanıcısı: root / Şifre: root123
Uygulama kullanıcısı: admin / Şifre: admin123
```

## Örnek Veritabanı ve Seed İşlemi

Sistem ilk kez başlatıldığında, `db/init/01_schema.sql` dosyası otomatik olarak çalıştırılır. Bu dosya şunları içerir:
- Gerekli tabloların oluşturulması
- Örnek kullanıcı grupları, kullanıcılar ve ekran atamaları
- Gelişmiş veritabanı işlemleri için `Trigger`, `Function` ve `Procedure`'ler
- JSON esnek alanlarına sahip örnek kayıtlar

Veritabanının tam ve manuel bir yedeği, referans amacıyla `db/sample_database.sql` dosyasında da mevcuttur.

## Öne Çıkan Özellikler

- **Dinamik Grup-Ekran Yetkisi:** Süpervizör ekranından gruplara özel yetki atama mekanizması.
- **İnce Ayarlı CRUD Yönetimi:** Sayfa bazında okuma, yazma, güncelleme ve silme izinlerinin saklanması.
- **Güvenli Dosya Yönetimi:** Yüklenecek dosyalar için dinamik uzantı kısıtlamaları (`txt`, `png`, `pdf`, `xlsx` vb.).
- **Esnek Veri Modeli:** MySQL `JSON` özellikleri kullanılarak şemasız ve esnek veri saklama imkanı (`/records` endpointleri).
- **Asenkron İşlemler:** RabbitMQ RPC altyapısıyla arka planda çalışan Worker servisi ve asenkron loglama.
- **Yapay Zeka Hazırlığı:** Dosya analizi ve dönüştürme işlemleri yapabilen, RAG/MCP yeteneklerine hazır ayrı bir AI mikroservisi.

## GitHub Bağlantısı

Proje kaynak kodlarına aşağıdaki adresten ulaşabilirsiniz:
[Cin42720/Gelismis-Admin-Paneli](https://github.com/Cin42720/Gelismis-Admin-Paneli)
