# Yönetim Paneli Kılavuzu

## Yönetim Paneline Erişim

Yönetim paneline şu adresten erişebilirsiniz: `http://alanadi.com/admin`

## İlk Kurulum - Admin Kullanıcısı Oluşturma

İlk admin kullanıcısını Supabase kontrol panelinden manuel olarak oluşturmanız gerekiyor:

### Adım 1: Supabase'de Kullanıcı Oluşturun

1. Supabase proje panonuza gidin
2. **Authentication > Users** bölümüne gidin
3. **Add user** butonuna tıklayın
4. Formu doldurun:
   - **Email**: admin@tugbaozturk.com (veya istediğiniz bir e-posta)
   - **Password**: Güvenli bir şifre oluşturun (örn: Admin123456!)
   - **Auto Confirm User**: ✓ İşaretleyin (önemli!)
5. **Create user** butonuna tıklayın
6. Oluşturulan kullanıcının **ID**'sini kopyalayın

### Adım 2: Profil Oluşturun

1. Supabase panosunda **SQL Editor** bölümüne gidin
2. Aşağıdaki SQL kodunu çalıştırın (USER_ID'yi değiştirmeyi unutmayın):

```sql
INSERT INTO profiles (id, username, role, full_name)
VALUES (
  '55f2baec-ebe8-4848-9538-da5bbaff18c4',
  'admin',
  'admin',
  'Sistem Yöneticisi'
);
```

### Adım 3: Giriş Yapın

1. Tarayıcınızda `http://alanadi.com/admin` adresine gidin
2. **Kullanıcı Adı**: `admin`
3. **Şifre**: Adım 1'de belirlediğiniz şifre
4. **Giriş Yap** butonuna tıklayın

## Giriş Bilgileri

Admin paneline giriş yapmak için:

- **Kullanıcı Adı**: `admin` (veya oluşturduğunuz kullanıcı adı)
- **Şifre**: Supabase'de belirlediğiniz şifre

## Kullanıcı Rolleri

Sistem 5 farklı kullanıcı rolünü destekler:

- **admin**: Tüm özelliklere tam erişim
- **finance**: Finans yönetimi ve raporlara erişim
- **staff**: Öğrenci ve ders yönetimine erişim
- **teacher**: Ders programı ve yoklama erişimi
- **student**: Kendi verilerine sınırlı erişim

## Modüllere Göre Özellikler

### Ana Panel
- Gerçek zamanlı istatistikler
- Devam eden dersler görünümü
- Finansal özet
- Bekleyen görevlere hızlı erişim

### Öğrenci Yönetimi
- Tam CRUD işlemleri (Oluştur, Oku, Güncelle, Sil)
- Gelişmiş filtreleme ve arama
- Ödeme takibi
- Taksit yönetimi
- Aylık yoklama takvimi
- Sözleşme ve makbuz oluşturma
- Excel/PDF'e aktarma

### Personel Yönetimi
- Çalışan kayıtları
- Sözleşme yönetimi
- Yoklama takibi
- Maaş yönetimi
- Performans raporları

### Ders Yönetimi
- Çakışma kontrolü ile ders programı oluşturma
- Doküman yükleme ve yönetimi
- Yönetmelik görüntüleyici
- Sorun bildirimi sistemi

### Finans Yönetimi
- Gelir/gider takibi
- Kasa yönetimi
- Ödeme talepleri (tekli ve toplu)
- Aylık/yıllık raporlar
- WhatsApp/SMS entegrasyonu ile ödeme hatırlatmaları

### Kullanıcı Rolleri Yönetimi
- Kullanıcı oluştur ve yönet
- Rol ve yetki atama
- Yetki matrisi yapılandırması

## Güvenlik

- Tüm veriler Row Level Security (RLS) ile korunmaktadır
- Veritabanı seviyesinde rol tabanlı erişim kontrolü
- Şifre sıfırlama özelliği ile güvenli kimlik doğrulama
- Dosya yüklemeleri kullanıcı rolleri ile korunmaktadır

## Veritabanı Yapısı

Sistem Supabase kullanır:
- **Authentication**: Kullanıcı yönetimi ve giriş
- **Database**: RLS politikaları ile PostgreSQL
- **Storage**: Dosya ve doküman depolama

Tüm tablolar organizasyon için yapılandırılmıştır:
- `students` - Öğrenci kayıtları
- `staff` - Personel üyeleri
- `courses` - Ders tanımları
- `schedules` - Haftalık programlar
- `finance_transactions` - Tüm finansal kayıtlar
- `student_installments` - Ödeme taksitleri
- `student_attendance` / `staff_attendance` - Yoklama takibi
- Ve daha fazlası...

## Şifre Sıfırlama

Şifrenizi unuttuysanız:

1. Giriş sayfasında **"Şifrenizi mi unuttunuz?"** linkine tıklayın
2. E-posta adresinizi girin
3. E-postanıza gelen bağlantıya tıklayın
4. Yeni şifrenizi belirleyin

## Destek

Teknik destek veya sorularınız için sistem yöneticinizle iletişime geçin.
