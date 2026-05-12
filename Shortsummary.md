# HalalBank — Kısa Özet

## Mimari: Clean Architecture (3 Katman)
```
API (Controllers, Middleware, Program.cs)
      ↓ (bağımlılık içe doğru)
Application (Services, Interfaces, DTOs, Mappers)
      ↓
Domain (Entities, Enums) — hiçbir framework bağımlılığı yok
      ↑
Infrastructure (Data/EF Core, Repositories, External Services)
```
- **Domain**: `Customer.cs`, `Subscription.cs`, `Payment.cs` — saf C#, framework referansı yok
- **Application**: İş mantığı — `PaymentTaskService`, `PaymentService`, `AuthService`. Interface'ler burada, somut sınıflar Infrastructure'da
- **Infrastructure**: EF Core DbContext, Repository implementasyonları, `MockBankMessageHandler`, `EmailNotificationService` (SendGrid)
- **API**: Controller'lar, Exception middleware'i, JWT auth setup, DI kayıtları (`Program.cs`)

DI (Dependency Injection): `Program.cs`'de `builder.Services.AddScoped<IService, Service>()` ile kaydedilir. Controller'lar constructor'dan interface alır.

---

## Monolithic vs Microservice
**Monolithic**: Tek .NET 8 projesi, tek deploy, tek PostgreSQL DB. Background service (`ScheduledPaymentService`) aynı process'te çalışır. Basit ve yeterli.

**Microservice olsaydı**: Her bounded context (Payment, Subscription, Auth, Notification) ayrı servis, ayrı DB, ayrı deploy edilirdi. Servisler arası HTTP/gRPC/message queue gerekirdi. HalalBank'ta yapmadık — proje ölçeği monolithic'i hak ediyor.

---

## Google OAuth (API ile Haberleşme)
1. Kullanıcı "Sign in with Google" tıklar → frontend Google Identity Services ile `idToken` alır
2. Frontend `POST /api/auth/google-login` ile `idToken`'ı backend'e yollar
3. Backend (`AuthService.GoogleLoginAsync`): `GoogleJsonWebSignature.ValidateAsync(idToken, settings)` ile token'ı doğrular — backend → Google'a HTTPS istek atar
4. Doğrulama başarılı → email + name alınır → DB'de varsa login, yoksa Customer oluştur
5. Backend kendi JWT'sini üretir (BCrypt hash yok, Google auth'ta şifresiz) → frontend'e döner
6. Frontend JWT'yi localStorage'a kaydeder, sonraki tüm isteklerde `Authorization: Bearer <jwt>` header'ı
7. Google'la bağlantı SADECE login anında — sonrası tamamen bizim JWT'mizle

Normal login: Email + password → `BCrypt.Net.BCrypt.HashPassword/Verify` ile şifre doğrulama → JWT üretimi.

---

## CI/CD (Railway + Cloudflare)
- **CI**: Manuel — `git push origin master` yeterli
- **Railway (Backend)**:
  - Nixpacks builder .NET 8'i otomatik build eder
  - `DATABASE_URL` environment variable ile PostgreSQL'e bağlanır
  - `Program.cs`'de `MigrateAsync()` ile migration'lar otomatik çalışır
  - `railway.json` ile health check (`/api/health`) ve restart policy tanımlı
  - Crash'te auto-restart, 6 saatte bir background service çalışır
- **Cloudflare Pages (Frontend)**:
  - GitHub reposuna bağlı, her push'ta `npm run build` çalıştırır
  - `_redirects` (`/* /index.html 200`) ile SPA routing
  - `_headers` (`Cache-Control: no-cache`) ile cache sorunları önlenir
- **İletişim**: Cloudflare'de `VITE_API_URL` = Railway domain'ine ayarlanır. Frontend API çağrıları doğrudan Railway'e gider. Ayrı domainler, ortak veritabanı yok.

---

## Feature'lar ve Nasıl Yapıldı

| Feature | Açıklama |
|---------|----------|
| **JWT Auth** | `Program.cs`'de `AddAuthentication().AddJwtBearer()`. `[Authorize]` attribute'u ile endpoint'ler korunur. Admin/Customer rol ayrımı `[Authorize(Roles = "Admin")]` ile |
| **BCrypt Şifreleme** | Kayıt: `BCrypt.HashPassword(password)`. Giriş: `BCrypt.Verify(password, hash)`. Hash asla düz metin tutulmaz |
| **Abonelik CRUD** | `SubscriptionsController` → `SubscriptionService` → `ISubscriptionRepository` → EF Core. Admin her şeyi görebilir, customer sadece kendininkini |
| **Otomatik Ödeme (Background)** | `ScheduledPaymentService` : `BackgroundService`. 6 saatte bir: vadesi geçenleri bul → mock bankadan borç sorgula → ödemeyi dene → başarılıysa Payment kaydı oluştur + NextPaymentDate'i 1 ay ötele |
| **Mock Banka** | `MockBankMessageHandler` : `HttpMessageHandler`. `IHttpClientFactory` ile inject edilir. `/debt` endpoint'i her zaman `{ amount: expectedAmount }`, `/payment` her zaman `{ isSuccess: true }` döner |
| **Borç Sorgulama (UI)** | Dashboard'da her satırda "Query Debt" butonu → `POST /api/payments/query-debt/{id}` → `HasSuccessfulPaymentForPeriodAsync` kontrolü → ödenmişse `amount: 0`, değilse borç bilgisi |
| **Email Bildirimleri** | `INotificationService` → SendGrid (gerçek) veya Console log (mock). 3 tür: Reminder (3 gün kala), Overdue (vade geçince), Status Change |
| **Overdue Email** | Scheduled service'te ödeme işlemeden ÖNCE gönderilir — böylece `NextPaymentDate` henüz ötelenmemişken `GetOverdueAsync` doğru sonuç verir |
| **Admin Process** | Background auto-payment'ı manuel tetikler. `ProcessSubscriptionPaymentAsync(int id)` — zaten ödenmişse veya vadesi gelmemişse skip eder (yeni fix) |
| **Müşteri Yönetimi** | Admin panelinde CRUD: oluşturma, listeleme, silme. Backend'de `CustomersController` (GET, POST, DELETE) hazır |
| **Discover Sayfası** | Role kontrolü `user?.role === 'Customer'` yerine `user?.customerId` ile yapılır — Google ile kaydolan eski hesaplarda role boş olabiliyor |
| **Health Check** | `GET /api/health` → Railway healtcheck için kullanılır |

---

## Yeni Feature Ekleme Adımları
1. **Domain**: Entity'e yeni property veya yeni Entity ekle
2. **Application**: Interface + Service yaz (`IService.cs` + `Service.cs`), DTO + MappingProfile güncelle
3. **Infrastructure**: Repository'e metod ekle (EF Core LINQ query)
4. **API**: Controller'a endpoint ekle, `Program.cs`'e `AddScoped` ile DI kaydı
5. **Frontend**: `api.ts`'ye metod ekle, component/page oluştur/güncelle
6. **Test**: Unit test yaz → `dotnet test` (backend) + `npm test && npm run build` (frontend)

---

---

## Terimler Sözlüğü

| Terim | Açıklama | Projede Nerede Kullanılıyor |
|-------|----------|------------------------------|
| **Interface** | Sözleşme — bir sınıfın hangi metodları olması gerektiğini tanımlar, nasıl çalıştığını gizler. "Ne yapacağını söyler, nasıl yaptığını söylemez" | `INotificationService` (Email gönder), `IPaymentTaskService` (ödeme işle), `ISubscriptionRepository` (veritabanı sorgula). Tüm soyutlama interface üzerinden |
| **Interface üzerinden haberleşme** | Service, somut sınıfı değil interface'i kullanır. Hangi somut sınıfın çalışacağını DI belirler. Örnek: `PaymentTaskController` `IPaymentTaskService` alır — aslında `PaymentTaskService` çalışır. Testte mock'u verirsin, production'da gerçeğini | Controller constructor'ları: `public DashboardController(ISubscriptionService subscriptionService)` — interface alır, somut sınıfı DI verir |
| **Dependency Injection (DI)** | Bağımlılıkları dışarıdan vermek. Sınıf kendi bağımlılığını `new()` ile oluşturmaz, constructor'dan alır. `Program.cs`'de hangi interface'e hangi sınıfın gideceği kaydedilir | `builder.Services.AddScoped<IPaymentService, PaymentService>()` → PaymentService alan her yere IPaymentService ver |
| **DI Registration** | `Program.cs`'de `AddScoped<Interface, Class>()` ile yapılır. 3 ömrü vardır: `AddScoped` (her HTTP isteğinde 1), `AddTransient` (her çağrıda 1), `AddSingleton` (uygulama ömrünce 1) | `AddScoped<IUnitOfWork, UnitOfWork>()`, `AddHostedService<ScheduledPaymentService>()`, `AddHttpClient("MockBankApi", ...)` |
| **Mock API / Servis** | Gerçek API yokmuş gibi davranan taklit. Gerçek banka API'si olmadığı için `MockBankMessageHandler` her isteğe sabit cevap döndürür. Testte de aynı mantık — `Mock<INotificationService>` gerçek email göndermez | `MockBankMessageHandler` → `/debt` sorgusuna `{ amount: 15.99 }`, `/payment`'e `{ isSuccess: true }` döndürür. Unit testlerde `Mock<IPaymentRepository>` |
| **EF Core (Entity Framework Core)** | .NET'in ORM'si — veritabanını C# nesneleriyle yönetmeni sağlar. SQL yazmadan tablo sorgulama, ekleme, silme yaparsın. LINQ ile sorgu yazılır, EF Core bunu SQL'e çevirir | `AppDbContext` içinde `DbSet<Customer>`, `DbSet<Subscription>`. `_context.Subscriptions.Where(s => s.Status == Active).ToListAsync()` → SQL'e çevrilir |
| **ORM (Object Relational Mapping)** | Veritabanı tablolarını C# sınıflarına (entity) eşler. `Customers` tablosu = `Customer` sınıfı. Her satır = bir nesne | `Subscription` entity'si → `Subscriptions` tablosu. Property'ler → kolonlar |
| **Repository Pattern** | Veritabanı sorgularını tek bir yerde toplar. Controller/service doğrudan DbContext kullanmaz, Repository üzerinden sorgular | `ISubscriptionRepository` → `GetOverdueAsync()`, `GetByCustomerIdAsync()`. Service `_unitOfWork.Subscriptions.GetOverdueAsync()` çağırır |
| **Unit of Work** | Birden çok repository'yi tek bir transaction altında toplar. `SaveChangesAsync()` çağrılana kadar hiçbir şey veritabanına yazılmaz | `IUnitOfWork` → `.Subscriptions`, `.Payments`, `.Customers`. `PaymentTaskService` ödemeyi yap → payment ekle → subscription güncelle → en son `SaveChangesAsync()` |
| **JWT (JSON Web Token)** | Kullanıcı giriş yapınca backend'in ürettiği token. İçinde kullanıcı ID, email, role gibi bilgiler var. İmzalı olduğu için backend kimin ürettiğini doğrulayabilir | Login'de üretilir: `JwtService.GenerateToken()`. Frontend her istekte `Authorization: Bearer <token>` gönderir |
| **BCrypt** | Şifre hash'leme algoritması. Aynı şifre bile her seferinde farklı hash üretir (salt ekler). Kaba kuvvet saldırılarına karşı yavaş çalışır | Kayıt: `BCrypt.HashPassword("pass123")` → `$2a$11$...`. Giriş: `BCrypt.Verify("pass123", storedHash)` → true/false |
| **Background Service** | Uygulama çalışırken arkada sürekli koşan iş parçacığı. `BackgroundService` sınıfından türetilir, `ExecuteAsync` metodu sürekli çalışır | `ScheduledPaymentService` — 6 saatte bir uyanır, vadesi geçen ödemeleri dener, email gönderir |
| **Middleware** | HTTP istek-cevap pipeline'ına yerleşen kod parçaları. İstek controller'a ulaşmadan veya cevap dönmeden araya girer | `ExceptionHandlingMiddleware` — hata fırlarsa JSON formatında düzgün hata mesajı döndürür |
| **LINQ (Language Integrated Query)** | C# içinde SQL benzeri sorgu yazma. Derleme zamanında hata yakalar, tip güvenlidir | `subscriptions.Where(s => s.Status == "Active" && s.NextPaymentDate <= now).ToListAsync()` |
| **DTO (Data Transfer Object)** | API dışarıya entity'nin tamamını değil, sadece gerekli alanlarını gösterir. Entity'deki Password alanını DTO'ya koymazsın, sızdırılmaz | `CustomerDto` → Id, FirstName, LastName, Email (Password yok). `CreatePaymentDto` → SubscriptionId, Amount |
| **Mapping (DTO ↔ Entity)** | DTO'yu entity'e veya entity'i DTO'ya çevirme işlemi. Manuel (her alanı tek tek ata) veya AutoMapper ile | `MappingProfile.cs`: `dto.ToEntity()` → `new Payment { Amount = dto.Amount, Status = Success }`. `entity.ToDto()` → `new PaymentDto { Id = p.Id, Amount = p.Amount }` |
| **Seed Data** | Uygulama ilk çalıştığında veritabanına önceden belirlenmiş verileri ekleme. Admin kullanıcısı, demo abonelikler vb | `Program.cs`'de `if (!db.Customers.Any())` ile başlangıç verileri eklenir. Admin email: `admin@test.com`, şifre: `admin123` |
| **CORS (Cross-Origin Resource Sharing)** | Frontend farklı domain'deyken (ör: Cloudflare) backend'e (ör: Railway) istek atmasına izin verme mekanizması | `Program.cs`: `policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()` — her domain'den gelen isteğe izin verir |
| **CRUD (Create-Read-Update-Delete)** | Dört temel veritabanı işlemi. API'de: `POST` (Create), `GET` (Read), `PUT` (Update), `DELETE` (Delete) | `SubscriptionsController`: GET all, GET by id, POST create, PUT update, DELETE |
| **Migration** | Veritabanı şemasını kodla yönetme. Entity'de alan ekleyince `dotnet ef migrations add ...` ile migration oluşturulur, `MigrateAsync()` ile otomatik uygulanır | `InitialCreate` → İlk tablolar. `AddCustomerRole` → Role kolonu eklendi |
| **REST API** | HTTP üzerinden veri alışverişi. Kaynaklar URL ile temsil edilir (`/api/customers`, `/api/subscriptions/5`). İşlemler HTTP metodlarıyla yapılır (GET, POST, PUT, DELETE) | Tüm controller'lar REST prensipleriyle yazılmıştır |

---

## Önemli Dosyalar

| Dosya | Ne işe yarar |
|-------|-------------|
| `src/API/Program.cs` | DI kayıtları, JWT config, seed data, CORS, middleware |
| `src/API/ScheduledPaymentService.cs` | 6 saatte bir çalışan background service |
| `src/Application/Services/PaymentTaskService.cs` | Auto-payment iş mantığı (ProcessOverdue, ProcessSingle) |
| `src/Application/Services/AuthService.cs` | Google OAuth doğrulama, JWT üretimi |
| `src/Infrastructure/ExternalServices/MockBankMessageHandler.cs` | Mock banka HTTP handler |
| `src/Infrastructure/ExternalServices/EmailNotificationService.cs` | SendGrid email gönderme |
| `frontend/src/pages/Dashboard.tsx` | Müşteri/Admin dashboard'u |
| `frontend/src/pages/Admin.tsx` | Admin paneli (abonelik + müşteri yönetimi) |
| `frontend/src/pages/Discover.tsx` | Abonelik keşif sayfası |
| `railway.json` | Railway deploy config (healthcheck, restart) |
| `frontend/public/_redirects` | Cloudflare SPA routing |
| `frontend/public/_headers` | Cloudflare cache control |
