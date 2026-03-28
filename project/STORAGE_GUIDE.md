# Supabase Storage Kullanım Kılavuzu

Bu proje, dosya yükleme ve depolama için Supabase Storage kullanmaktadır.

## 📦 Oluşturulan Bucket'lar

Projenizde 3 adet storage bucket oluşturulmuştur:

### 1. **announcements-images**
- **Amaç**: Duyuru görselleri
- **İzin verilen dosya türleri**: JPG, JPEG, PNG, WEBP
- **Maksimum dosya boyutu**: 5 MB
- **Erişim**: Herkese açık (public)

### 2. **documents**
- **Amaç**: Kurs materyalleri, takvimler, PDF dosyaları
- **İzin verilen dosya türleri**: PDF, DOC, DOCX
- **Maksimum dosya boyutu**: 10 MB
- **Erişim**: Herkese açık (public)

### 3. **gallery**
- **Amaç**: Etkinlik fotoğrafları, galeri görselleri
- **İzin verilen dosya türleri**: JPG, JPEG, PNG, WEBP
- **Maksimum dosya boyutu**: 5 MB
- **Erişim**: Herkese açık (public)

## 🔐 Güvenlik Politikaları

- **Okuma (Read)**: Herkes görsel/dosyalara erişebilir (public)
- **Yazma (Upload/Update/Delete)**: Sadece kimlik doğrulaması yapılmış kullanıcılar

## 🎯 Admin Panel Kullanımı

### Admin Paneline Erişim

Admin paneline erişmek için URL'nize `?admin=true` parametresini ekleyin:

```
https://your-website.com?admin=true
```

### Duyuru Oluşturma (Görsel ile)

1. Admin paneline gidin
2. "Yeni Duyuru" butonuna tıklayın
3. Formu doldurun:
   - Başlık
   - Tarih
   - Kategori (Duyuru, Deneme, Program)
   - Özet
   - İçerik
   - Duyuru Görseli (opsiyonel)
   - CTA butonu metni
4. Görsel yüklemek için "Dosya yükle" alanına tıklayın
5. Görseli seçin (maks 5MB, JPG/PNG/WEBP)
6. "Oluştur" butonuna tıklayın

### Duyuru Düzenleme

1. Admin panelinde duyuru listesinden düzenlemek istediğiniz duyurunun yanındaki "Düzenle" ikonuna tıklayın
2. Değişiklikleri yapın
3. "Güncelle" butonuna tıklayın

### Duyuru Silme

1. Duyuru listesinde silmek istediğiniz duyurunun yanındaki "Sil" ikonuna tıklayın
2. Onay verin

## 💻 Kod Kullanımı

### Dosya Yükleme

```typescript
import { uploadFile } from '../lib/storage';

const handleUpload = async (file: File) => {
  const result = await uploadFile({
    bucket: 'announcements-images', // veya 'documents', 'gallery'
    file: file,
  });

  if (result.success) {
    console.log('Dosya URL:', result.url);
    console.log('Dosya yolu:', result.path);
  } else {
    console.error('Hata:', result.error);
  }
};
```

### Dosya Silme

```typescript
import { deleteFile } from '../lib/storage';

const handleDelete = async () => {
  const result = await deleteFile('announcements-images', 'dosya-yolu.jpg');

  if (result.success) {
    console.log('Dosya silindi');
  }
};
```

### Public URL Alma

```typescript
import { getPublicUrl } from '../lib/storage';

const imageUrl = getPublicUrl('announcements-images', 'dosya-yolu.jpg');
console.log('Görsel URL:', imageUrl);
```

## 🎨 Özellikler

### Duyurularda Görsel Desteği

- Duyurular artık görsel içerebilir
- Görseller otomatik olarak optimize edilir
- Responsive tasarım: Tüm cihazlarda düzgün görüntülenir
- Hover efektleri: Görseller üzerine gelindiğinde büyür

### FileUpload Komponenti

Yeniden kullanılabilir dosya yükleme komponenti:

```typescript
import FileUpload from './components/FileUpload';

<FileUpload
  bucket="announcements-images"
  onUploadComplete={(url, path) => {
    console.log('Yüklenen dosya:', url);
  }}
  accept="image/*"
  maxSizeMB={5}
  label="Görsel Yükle"
/>
```

## 📝 Veritabanı Şeması

Announcements tablosuna yeni alan eklendi:

```sql
image_url text -- Duyuru görselinin URL'si (opsiyonel)
```

## 🔧 Geliştirme Notları

- Storage bucket'ları otomatik olarak oluşturulmuştur
- RLS (Row Level Security) politikaları aktiftir
- Tüm bucket'lar public read erişimine sahiptir
- Upload/Update/Delete işlemleri için authentication gereklidir

## 🚀 Gelecek Geliştirmeler

Bu storage altyapısı üzerine eklenebilecek özellikler:

1. **Galeri Sayfası**: `gallery` bucket'ını kullanarak etkinlik fotoğrafları
2. **Döküman İndirme**: `documents` bucket'ından ders materyalleri
3. **Öğrenci Profil Fotoğrafları**: Yeni bir `profiles` bucket'ı
4. **Video Desteği**: Video paylaşımı için yeni bucket
5. **Toplu Yükleme**: Birden fazla dosya yükleme özelliği

## 📞 Yardım

Herhangi bir sorunla karşılaşırsanız:
1. Supabase Dashboard'unuzu kontrol edin
2. Storage bucket'larının oluşturulduğundan emin olun
3. RLS politikalarının aktif olduğunu doğrulayın
4. Browser console'da hata mesajlarını kontrol edin
