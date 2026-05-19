# Internet Programciligi Final Projesi

Bu repo, tek kisilik final projesi icin hazirlanmis Docker tabanli bir admin paneli projesidir. Kapsam: uc grup, supervisor yetki atama ekrani, CRUD izinleri, dosya yukleme kisitlari, RabbitMQ RPC akisi, MySQL JSON veri modeli, loglama, Docker ve AI analiz servisi ayni mimaride gosterilir.

## Teknoloji Secimi

- Frontend: React + Vite + TailwindCSS
- Backend: FastAPI
- Mesajlasma: RabbitMQ, RPC cevap kuyrugu mantigi
- Veritabani: MySQL, ana kolonlar + `value JSON`
- Cache/oturum genisletme: Redis
- AI servis: FastAPI tabanli ayri servis; RAG/MCP entegrasyonu icin genisletilebilir
- Calisma ortami: Docker Compose

## Roller ve Gruplar

- `supervisor`: Tum ekranlari ve CRUD yetkilerini atar/cikarir.
- `student`: Kendisine atanan ekranlari kullanir.
- `school`: Kendisine atanan ekranlari kullanir.
- `company`: Kendisine atanan ekranlari kullanir.

## Demo Giris Bilgileri

Frontend acilisinda login ekrani vardir. Backend tarafinda demo login endpointi: `POST /auth/login`.

```text
Supervisor:
  E-posta: supervisor@example.com
  Sifre: 123456

Ogrenci:
  E-posta: ogrenci@example.com
  Sifre: 123456

Okul:
  E-posta: okul@example.com
  Sifre: 123456

Isletme:
  E-posta: isletme@example.com
  Sifre: 123456
```

Supervisor tum gruplarin ekran ve CRUD izinlerini yonetir. Diger kullanicilar kendi grubuna ait panel ekranlarini kullanir.

## Proje Klasorleri

```text
backend/       FastAPI API, auth, yetki, dosya ve AI proxy endpointleri
frontend/      React + Tailwind admin paneli
worker/        RabbitMQ RPC consumer ve loglayici worker
ai-service/    Dosya analizi, format donusumu ve RAG/MCP hazirlik servisi
db/init/       MySQL tablo, trigger, function, procedure ve ornek veriler
docs/          Mimari, yol haritasi ve teslim kontrol listesi
logs/          Uygulama log ciktilari
```

## Calistirma

1. Ortam dosyasini hazirla.

```bash
cp .env.example .env
```

2. Tum servisleri Docker ile baslat.

```bash
docker compose --env-file .env up --build
```

Windows'ta Docker Desktop yeni kurulduysa ve PowerShell `docker` komutunu gormuyorsa yeni terminal ac. Gerekirse gecici olarak:

```powershell
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
docker version
```

Docker Desktop "Privileged helper service" veya Hyper-V tarafina takilirsa WSL engine ayar notlari icin [docs/DOCKER_WINDOWS_NOTLARI.md](docs/DOCKER_WINDOWS_NOTLARI.md) dosyasina bak.

Not: Daha once eski seed verisiyle MySQL container'i calistirildiysa yeni ornek verilerin tekrar yuklenmesi icin once `docker compose down -v`, sonra `docker compose --env-file .env up --build` calistirilabilir. Bu komut mevcut MySQL volume verisini siler.

3. Servis adresleri:

- Frontend: `http://localhost:3001`
- Backend Swagger: `http://localhost:8000/docs`
- AI Servis Swagger: `http://localhost:8100/docs`
- RabbitMQ Panel: `http://localhost:15672` (`guest` / `guest`)
- MySQL: `localhost:3306`

4. MySQL baglanti bilgisi:

```text
Host: 127.0.0.1
Port: 3306
Database: admin_panel
Root kullanici: root
Root sifre: root123
Uygulama kullanicisi: admin
Uygulama sifresi: admin123
```

## Ornek Veritabani

Ornek MySQL veritabani [db/sample_database.sql](db/sample_database.sql) dosyasina eklenmistir. Docker Compose ilk kez calistiginda MySQL container'i [db/init/01_schema.sql](db/init/01_schema.sql) dosyasini otomatik yukler.

Bu dosyanin icinde:

- tablolar,
- ornek grup/kullanici/ekran/kayit verileri,
- trigger,
- function,
- procedure,
- JSON alan kullanan kayitlar

hazir olarak bulunur.

5. Hizli test:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/screens
curl http://localhost:8100/health
```

## Teslimde Gosterilecek Ana Maddeler

- Supervisor ekranindan grup-ekran yetkisi atama.
- CRUD izinlerinin grup bazli saklanmasi.
- Dosya uzantisi kisitlamasi: `txt`, `png`, `jpg`, `jpeg`, `pdf`, `doc`, `docx`, `xls`, `xlsx`.
- MySQL `JSON` alanlariyla esnek veri saklama.
- Ornek image dosyasi: [uploads/sample-panel.png](uploads/sample-panel.png).
- Grup ve ekran bazli JSON kayit CRUD endpointleri: `/records`.
- Log listeleme endpointi: `/logs`.
- Trigger/function/procedure ornegi: [db/init/01_schema.sql](db/init/01_schema.sql).
- RabbitMQ RPC consumer mantigi: [worker/main.py](worker/main.py).
- AI analiz ve donusum servis taslagi: [ai-service/app/main.py](ai-service/app/main.py).

## GitHub Linki

Teslimden once GitHub'a yukleyip linki [GITHUB_LINK.txt](GITHUB_LINK.txt) dosyasina ekle.
