# Docker Windows Notlari

Bu bilgisayarda Docker Desktop per-user kurulumla calisti. Sorun Hyper-V backend'e takilmasiydi; WSL 2 backend aktif edilince Docker Engine cevap verdi.

Kontrol komutlari:

```powershell
docker version
docker compose version
docker run hello-world
```

Docker CLI PATH sorunu olursa:

```powershell
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
docker version
```

Kalici PATH normalde su dizini icermeli:

```text
C:\Users\husey\AppData\Local\Programs\DockerDesktop\resources\bin
```

Docker Desktop Hyper-V/privileged helper ekraninda takilirsa Docker kapaliyken su dosyada WSL engine ayari kontrol edilebilir:

```text
%APPDATA%\Docker\settings-store.json
```

Ilgili alan:

```json
{
  "WslEngineEnabled": true
}
```

Sonra Docker Desktop tekrar acilir.

Port cakismasini onlemek icin Docker Compose calistirmadan once bilgisayarda acik kalan RabbitMQ servisini kapat:

```powershell
Stop-Service RabbitMQ
```

Bilgisayarda ayrica MySQL aciksa onu da durdur. Docker Compose kendi MySQL ve RabbitMQ containerlarini acar.

Proje baslatma:

```powershell
cd "C:\Users\husey\OneDrive\Desktop\İnternet Programcılığı Final"
docker compose --env-file .env.example up --build -d
docker compose --env-file .env.example ps
```

Proje durdurma:

```powershell
docker compose --env-file .env.example down
```
