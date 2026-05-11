# Abonelik & Otomatik Ödeme Hatırlatma Uygulaması

## Açıklama
Abonelik & Otomatik Ödeme Hatırlatma Uygulaması, banka müşterilerinin düzenli abonelik ödemelerini (elektrik, su, internet, GSM vb.) tek bir platform üzerinden tanımlayabildiği, takip edebildiği ve ödeyebildiği basit bir bankacılık uygulamasıdır.

Uygulamada kullanıcı:
* Abonelik bilgilerini bir kez sisteme tanımlar
* Ödeme tarihi yaklaşınca mail veya SMS ile hatırlatma alır
* Eğer o dönem için ödeme yaptıysa hatırlatma almaz
* Uygulamaya girerek ilgili aboneliği seçip ödemesini gerçekleştirir
* Yapılan tüm ödemelerin geçmişini görüntüleyebilir
* Dilerse, abonelik şirketlerinden borç bilgisini üçüncü parti servisler aracılığıyla sorgulayabilir

Bu case study ile adaydan; abonelik – ödeme dönemi – ödeme durumu – dış servis entegrasyonu ilişkisini doğru şekilde modellemesi beklenmektedir.

---

## Özellikler

### 1. Müşteri Yönetimi (Customers)
* Müşteri oluşturma
* Müşteri bilgilerini görüntüleme
* Müşteri silme

### 2. Abonelik Yönetimi (Subscriptions)
Kullanıcı, düzenli yaptığı her ödeme için bir abonelik kaydı oluşturur. Bir abonelik; "Her ay düzenli olarak ödediğim bir hizmete ait ödeme"yi temsil eder.

Her abonelik için aşağıdaki bilgiler saklanmalıdır:
* Abonelik türü (Elektrik, Su, İnternet, GSM vb.)
* Hizmet sağlayıcı adı
* Abonelik numarası / müşteri numarası
* Abonelik durumu (Aktif / Pasif)

Abonelikler için CRUD işlemleri:
* Abonelik ekleme
* Abonelik güncelleme
* Abonelik silme
* Abonelik listeleme

Abonelik bir kez tanımlanır, her ay yeniden oluşturulmaz.

### 3. Borç Sorgulama (Üçüncü Parti Servis – Mock)
Kullanıcı, bir abonelik için ödeme yapmadan önce:
* Aboneliği seçer
* İsterse "Borç Sorgula" aksiyonunu çalıştırır

Bu işlem sırasında sistem:
* İlgili abonelik bilgilerini kullanarak
* Üçüncü parti (mock) servis çağrısı yapar
* Güncel borç bilgisini kullanıcıya gösterir

Borç bilgisi örnek alanlar:
* Borç tutarı
* Son ödeme tarihi
* Dönem bilgisi

Gerçek entegrasyon zorunlu değildir. Mock REST servis yeterlidir.

### 4. Ödeme İşlemleri (Payments)
Kullanıcı:
* Ödeme yapmak istediği aboneliği seçer
* Borç sorgulama servisinden gelen tutarı kullanır
* Ödemesini gerçekleştirir

Ödeme sırasında aşağıdaki bilgiler saklanmalıdır:
* Hangi aboneliğe ait olduğu
* Ödeme tutarı
* Ödeme tarihi
* Ödeme dönemi (örnek: 2026 05)
* Ödeme durumu (Başarılı / Başarısız)

Ödeme işlemleri için mock (sahte) ödeme servisi yeterlidir.

### 5. Hatırlatma Mekanizması (optional)
Sistem, abonelikler için ödeme tarihlerini kontrol eder.

Kurallar:
* Eğer ödeme tarihi yaklaşmışsa ve
* İlgili dönem için henüz ödeme yapılmamışsa → Kullanıcıya mail veya SMS hatırlatma gönderilir
* Eğer ilgili dönem için ödeme yapılmışsa → Hatırlatma gönderilmez

Background job zorunlu değildir. Listeleme veya kontrol endpoint'leri üzerinden yapılması yeterlidir.

### 6. Özet & Görüntüleme
Kullanıcı için aşağıdaki bilgiler gösterilebilmelidir:
* Aktif abonelik listesi
* Bu ay ödeme yapılmamış abonelikler
* Yapılan ödemelerin listesi
* Abonelik bazlı ödeme geçmişi
* Borç sorgulama sonucu (varsa)

### 7. Üçüncü Parti Servislerle Etkileşim (Mock)
Sistem, en az iki farklı üçüncü parti REST servisle etkileşim kurmalıdır.
Örnek:
* Borç sorgulama servisi (abonelik firması – mock)
* Ödeme servisi (başarılı / başarısız)
* Bildirim servisi (Email / SMS)(optional.)

---

## Beklentiler

### Kullanılması gereken teknolojiler
* **Backend:** C#, .NET / .NET Core
* **Frontend:**
    * **WEB:** React (HTML, CSS, vanilla JavaScript de kullanılabilir) veya
    * **MOBILE:** Swift (iOS) veya Kotlin (Android) (Flutter vb. cross platform araçlar kullanılmamalıdır)
* **Veritabanı:** Microsoft SQL Server (PostgreSQL veya MySQL de kullanılabilir)

### Yapay Zeka Kullanımı:
Tüm case çalışmalarında, adayların yapay zeka destekli geliştirme yaklaşımlarını kullanması ve bunu bilinçli şekilde dokümante etmesi beklenmektedir.

#### AI Kullanım Kapsamı (Serbest ama Ölçülebilir)
Aday;
* Kod üretimi
* Refactoring
* Validation kuralları oluşturma
* Test senaryosu üretme
* API tasarım önerileri
* Basit business rule açıklamaları gibi alanlarda yapay zekadan destek alabilir.

Amaç: Adayın AI kullanabilmesi değil, AI'ı nasıl kullandığını ve kontrol edebildiğini görmektir.

#### AI Kullanımı ile İlgili Beklentiler
Adaydan aşağıdakiler beklenmektedir:
* Yapay zekayı hangi amaçlarla kullandığını açıklaması
* AI tarafından üretilen çıktıları doğrudan kullanmak yerine gözden geçirip düzenlemesi
* AI kullanımını README.md içerisinde açıkça belirtmesi

---

## Data Modeling
Veritabanında saklanması beklenen temel tablolar:
* Customers
* Subscriptions
* Payments

**İlişkiler:**
* Bir müşteri → birden fazla abonelik
* Bir abonelik → birden fazla ödeme

---

## CRUD Yapısı
CRUD işlemleri aşağıdaki resource'lar için kurgulanmalıdır:
* Customers → Create / Read / Delete
* Subscriptions → Create / Read / Update / Delete
* Payments → Create / Read

---

## Sistem Tasarım Dokümanları
Adaydan aşağıdaki dokümantasyonlar beklenmektedir:
* ER Diagram (Customer – Subscription – Payment)
* API endpoint listesi
* Borç sorgulama → ödeme → hatırlatma akış diyagramı
* README.md

---

## Değerlendirme Kriterleri
* Abonelik – ödeme dönemi mantığı
* Dış servis (mock) entegrasyonu
* Tarih & ödeme kontrolü
* Okunabilir ve sade kod
* REST API tasarımı
* Dokümantasyon kalitesi
* UI görselliği ikincil önemdedir. Doğru, tutarlı ve anlaşılır çalışan sistem önceliklidir.