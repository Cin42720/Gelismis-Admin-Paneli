# Mimari Ozet

## Akis

1. Kullanici React admin panelinden istek gonderir.
2. FastAPI backend, grup ve ekran yetkisini kontrol eder.
3. CRUD/dosya/AI islemi icin MySQL'e veri yazar veya AI servise istek acar.
4. Backend her kritik islem icin RabbitMQ'ya RPC mesaji yollar.
5. Worker mesaji isler, sonucu cevap kuyruguna doner ve log kaydi olusturur.
6. Supervisor log ekranindan tum islemleri izler.

## Veri Modeli Yaklasimi

Odev maddesine uygun olarak temel kolonlar sabit, degisebilecek bilgiler `value JSON` alaninda tutulur.

Ornek:

```sql
id INT AUTO_INCREMENT PRIMARY KEY,
created_at TIMESTAMP,
value JSON
```

Bu sayede ogrenci, okul ve isletme icin farkli alanlar ayni tabloda esnek bicimde saklanabilir.

## RabbitMQ RPC Mesaj Formati

```json
{
  "operation": "permission.updated",
  "actor_user_id": 1,
  "payload": {
    "group": "student",
    "screen": "student-list",
    "can_read": true
  }
}
```

Worker cevabi:

```json
{
  "ok": true,
  "message": "Islem basariyla islendi"
}
```

## AI Servis Kapsami

- `txt`: Prompt komutlarini ayiklar ve isleme hazir hale getirir.
- `doc/docx`: HTML donusumu icin pipeline noktasi saglar.
- `pdf`: Metin cikarma ve ozetleme icin genisletilir.
- RAG/MCP: Bu iskelette endpoint ve servis ayrimi hazirdir; gercek model entegrasyonu son asamada eklenir.
