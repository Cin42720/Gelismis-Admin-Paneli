# İnternet Programcılığı Final Projesi

Bu repo, tek kişilik final projesi için hazırlanmış Docker tabanlı bir admin paneli projesidir. Kapsam: üç grup, süpervizör yetki atama ekranı, CRUD izinleri, dosya yükleme kısıtları, RabbitMQ RPC akışı, MySQL JSON veri modeli, loglama, Docker ve AI analiz servisi aynı mimaride gösterilir.

## Teknoloji Seçimi

- Frontend: React + Vite + TailwindCSS
- Backend: FastAPI
- Mesajlaşma: RabbitMQ, RPC cevap kuyruğu mantığı
- Veritabanı: MySQL, ana kolonlar + `value JSON`
- Önbellek / oturum genişletme: Redis
- AI servis: FastAPI tabanlı ayrı servis; RAG/MCP entegrasyonu için genişletilebilir
- Çalışma ortamı: Docker Compose

## Roller ve Gruplar

- `supervisor`: Tüm ekranları ve CRUD yetkilerini atar/çıkarır.
- `student`: Kendisine atanan ekranları kullanır.
- `school`: Kendisine atanan ekranları kullanır.
- `company`: Kendisine atanan ekranları kullanır.

## Demo Giriş Bilgileri

Frontend açılışında login ekranı vardır. Backend tarafında demo login endpointi: `POST /auth/login`.

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

Süpervizör tüm grupların ekran ve CRUD izinlerini yönetir. Diğer kullanıcılar kendi grubuna ait panel ekranlarını kullanır.

## Proje Klasörleri

```text
backend/       FastAPI API, auth, yetki, dosya ve AI proxy endpointleri
frontend/      React + Tailwind admin paneli
worker/        RabbitMQ RPC consumer ve loglayıcı worker
ai-service/    Dosya analizi, format dönüşümü ve RAG/MCP hazırlık servisi
db/init/       MySQL tablo, trigger, function, procedure ve örnek veriler
docs/          Mimari, yol haritası ve teslim kontrol listesi
logs/          Uygulama log çıktıları
```

## Çalıştırma

1. Ortam dosyasını hazırla.

```bash
cp .env.example .env
```

2. Tüm servisleri Docker ile başlat.

```bash
docker compose --env-file .env up --build
```

Windows'ta Docker Desktop yeni kurulduysa ve PowerShell `docker` komutunu görmüyorsa yeni terminal aç. Gerekirse geçici olarak:

```powershell
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
docker version
```

Docker Desktop "Privileged helper service" veya Hyper-V tarafına takılırsa WSL engine ayar notları için [docs/DOCKER_WINDOWS_NOTLARI.md](docs/DOCKER_WINDOWS_NOTLARI.md) dosyasına bak.

Not: Daha önce eski seed verisiyle MySQL container'ı çalıştırıldıysa yeni örnek verilerin tekrar yüklenmesi için önce `docker compose down -v`, sonra `docker compose --env-file .env up --build` çalıştırılabilir. Bu komut mevcut MySQL volume verisini siler.

3. Servis adresleri:

- Frontend: `http://localhost:3001`
- Backend Swagger: `http://localhost:8000/docs`
- AI Servis Swagger: `http://localhost:8100/docs`
- RabbitMQ Panel: `http://localhost:15672` (`guest` / `guest`)
- MySQL: `localhost:3306`

4. MySQL bağlantı bilgisi:

```text
Host: 127.0.0.1
Port: 3306
Database: admin_panel
Root kullanıcı: root
Root şifre: root123
Uygulama kullanıcısı: admin
Uygulama şifresi: admin123
```

## Örnek Veritabanı

Örnek MySQL veritabanı [db/sample_database.sql](db/sample_database.sql) dosyasına eklenmiştir. Docker Compose ilk kez çalıştığında MySQL container'ı [db/init/01_schema.sql](db/init/01_schema.sql) dosyasını otomatik yükler.

Bu dosyanın içinde:

- tablolar,
- örnek grup/kullanıcı/ekran/kayıt verileri,
- trigger,
- function,
- procedure,
- JSON alan kullanan kayıtlar

hazır olarak bulunur.

5. Hızlı test:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/screens
curl http://localhost:8100/health
```

## Teslimde Gösterilecek Ana Maddeler

- Süpervizör ekranından grup-ekran yetkisi atama.
- CRUD izinlerinin grup bazlı saklanması.
- Dosya uzantısı kısıtlaması: `txt`, `png`, `jpg`, `jpeg`, `pdf`, `doc`, `docx`, `xls`, `xlsx`.
- MySQL `JSON` alanlarıyla esnek veri saklama.
- Örnek image dosyası: [uploads/sample-panel.png](uploads/sample-panel.png).
- Grup ve ekran bazlı JSON kayıt CRUD endpointleri: `/records`.
- Log listeleme endpointi: `/logs`.
- Trigger/function/procedure örneği: [db/init/01_schema.sql](db/init/01_schema.sql).
- RabbitMQ RPC consumer mantığı: [worker/main.py](worker/main.py).
- AI analiz ve dönüşüm servis taslağı: [ai-service/app/main.py](ai-service/app/main.py).

## GitHub Linki

GitHub proje deposu: [Cin42720/Geli-mi-Admin-Paneli-](https://github.com/Cin42720/Geli-mi-Admin-Paneli-)
