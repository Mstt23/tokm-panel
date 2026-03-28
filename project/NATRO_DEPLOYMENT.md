# Natro Hosting'de Deployment Rehberi

## Gerekli Bilgiler

Öncelikle elinizdeki bilgiler:
- Natro hosting paneli erişim bilgileriniz (cPanel)
- FTP bilgileriniz (eğer FTP kullanacaksanız)

## Adım 1: Projeyi Build Etme

Bilgisayarınızda proje klasöründe şu komutu çalıştırın:

```bash
npm install
npm run build
```

Bu komut `dist` klasörü oluşturacak. İçinde sitenizin tüm dosyaları olacak.

## Adım 2: Environment Variables İçin Özel Dosya Oluşturma

Natro'da environment variables ayarlamak zor olduğu için, dosyaları build ederken değişkenleri dahil etmemiz gerekiyor.

`.env` dosyanız zaten mevcut ve doğru değerlere sahip. Build işlemi sırasında bu değerler otomatik olarak kodunuza gömülecek.

## Adım 3: Dosyaları Natro'ya Yükleme

### Yöntem 1: cPanel File Manager (Önerilen)

1. **Natro cPanel'e giriş yapın**
   - https://cpanel.natro.com adresine gidin
   - Kullanıcı adı ve şifrenizi girin

2. **File Manager'ı açın**
   - cPanel ana sayfasında "Dosya Yöneticisi" veya "File Manager" seçeneğini bulun
   - Tıklayın

3. **public_html klasörüne gidin**
   - Sol taraftan `public_html` klasörünü bulun ve açın
   - Bu klasördeki **TÜM** eski dosyaları silin (varsa)

4. **Dosyaları yükleyin**
   - "Upload" butonuna tıklayın
   - Bilgisayarınızdaki `dist` klasörünün **içindeki** tüm dosyaları seçin
   - **ÖNEMLİ**: `dist` klasörünün kendisini değil, içindeki dosyaları yükleyin
   - Şunlar yüklenecek:
     - `index.html`
     - `_redirects`
     - `assets` klasörü
     - `favicon.ico`
     - `logo.png`
     - Ve diğer tüm dosyalar

5. **Dosya yapısı kontrolü**
   - `public_html` klasöründe şunları görmelisiniz:
     ```
     public_html/
     ├── index.html
     ├── _redirects
     ├── assets/
     │   ├── index-[hash].js
     │   └── index-[hash].css
     ├── favicon.ico
     ├── logo.png
     └── ... (diğer dosyalar)
     ```

### Yöntem 2: FTP ile Yükleme

1. **FileZilla veya benzeri FTP istemcisi kullanın**
   - Host: ftp.sitenizinadi.com (Natro'dan aldığınız FTP sunucusu)
   - Username: FTP kullanıcı adınız
   - Password: FTP şifreniz
   - Port: 21

2. **public_html klasörüne bağlanın**

3. **Eski dosyaları silin** (varsa)

4. **dist klasörünün içindeki tüm dosyaları yükleyin**

## Adım 4: .htaccess Dosyası Oluşturma

Natro Apache sunucu kullanır, bu yüzden `_redirects` dosyası çalışmayabilir. `.htaccess` dosyası oluşturun:

1. **cPanel File Manager'da**
2. **public_html klasöründeyken**
3. **"New File" butonuna tıklayın**
4. **Dosya adı**: `.htaccess`
5. **İçeriğini şöyle düzenleyin**:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>
```

## Adım 5: Sitenizi Test Edin

1. **Tarayıcıda sitenizi açın**: `https://sitenizinadi.com`

2. **Beyaz sayfa görüyorsanız**:
   - F12 tuşuna basın
   - Console sekmesine bakın
   - Kırmızı hatalar var mı kontrol edin

3. **Olası sorunlar ve çözümleri**:

   **Sorun 1**: "Failed to fetch" hataları
   - **Çözüm**: Environment variables build sırasında dahil edilmiş olmalı, `npm run build` komutunu tekrar çalıştırın

   **Sorun 2**: CSS yüklenmiyor
   - **Çözüm**: `assets` klasörünün doğru yüklendiğinden emin olun

   **Sorun 3**: 404 hatası (sayfa bulunamadı)
   - **Çözüm**: `.htaccess` dosyasının doğru oluşturulduğundan emin olun

## Adım 6: Cache Temizleme

1. **Tarayıcı cache'ini temizleyin**:
   - Chrome/Edge: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Veya Ctrl+Shift+R ile hard refresh yapın

2. **Cloudflare kullanıyorsanız** (Natro'da varsa):
   - Cloudflare paneline gidin
   - "Purge Cache" yapın

## Güncelleme Yaparken

Her güncelleme yaptığınızda:

1. Proje klasöründe:
   ```bash
   npm run build
   ```

2. `dist` klasörünün **içindeki** dosyaları Natro'ya yükleyin (üzerine yazın)

3. Tarayıcıda Ctrl+Shift+R ile sayfayı yenileyin

## Sorun Giderme

### Beyaz Sayfa Görünüyorsa

1. **Console'u kontrol edin** (F12 > Console)
2. **Dosya yollarını kontrol edin**: `index.html` dosyası `public_html` klasörünün **içinde** olmalı
3. **Environment variables**: Build sırasında dahil edildi, yerel `.env` dosyanızın doğru olduğundan emin olun
4. **Yeniden build ve yükleyin**

### Supabase Bağlantı Sorunu

Eğer console'da "Supabase credentials not found" hatası görüyorsanız:

1. Proje klasöründeki `.env` dosyasını kontrol edin
2. Değerlerin doğru olduğundan emin olun
3. `npm run build` komutunu tekrar çalıştırın
4. Yeni build'i yükleyin

## Destek

Sorun yaşarsanız:
1. Natro destek hattını arayın
2. cPanel'de "Support" bölümünden ticket açın
3. FTP ve dosya yükleme konusunda yardım isteyin

## Önemli Notlar

- **Environment variables** build sırasında kodunuza gömülür
- Her değişiklik sonrası **mutlaka** `npm run build` yapın
- **public_html** klasörüne sadece `dist` içindeki dosyaları yükleyin
- **.htaccess** dosyası React Router için gereklidir
- **Tarayıcı cache** bazen sorun çıkarır, mutlaka temizleyin
