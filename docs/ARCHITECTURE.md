# Mimari Özet

## Akış

1. Kullanıcı React admin panelinden istek gönderir.
2. FastAPI backend, grup ve ekran yetkisini kontrol eder.
3. CRUD/dosya/AI işlemi için MySQL'e veri yazar veya AI servise istek açar.
4. Backend her kritik işlem için RabbitMQ'ya RPC mesajı yollar.
5. Worker mesajı işler, sonucu cevap kuyruğuna döner ve log kaydı oluşturur.
6. Süpervizör log ekranından tüm işlemleri izler.

## Veri Modeli Yaklaşımı

Sistemin dinamik yapısına uygun olarak temel kolonlar sabit tutulmuş, değişebilecek veya genişletilebilecek bilgiler `value (JSON)` alanında esnek bir biçimde tasarlanmıştır.

Örnek:

```sql
id CHAR(36) PRIMARY KEY,
created_at TIMESTAMP,
value JSON
```

Bu sayede öğrenci, okul ve işletme için farklı alanlar aynı tabloda şemasız bir biçimde (schemaless) saklanabilir.

## RabbitMQ RPC Mesaj Formatı

Örnek bir RPC istek mesajı:

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

Worker cevabı (Reply-To kuyruğuna döner):

```json
{
  "ok": true,
  "message": "İşlem başarıyla işlendi"
}
```

## AI Servis Kapsamı

- `txt`: Prompt komutlarını ayıklar ve işleme hazır hale getirir.
- `doc/docx`: HTML dönüşümü için pipeline noktası sağlar.
- `pdf`: Metin çıkarma ve özetleme için genişletilebilir altyapı.
- RAG/MCP: Bu iskelette endpoint ve servis ayrımı hazırdır; model entegrasyonu için doğrudan bağlanabilir yapıdadır.
