# Deployment Talimatları

## Ortam Değişkenleri

Site'yi canlıya alırken aşağıdaki ortam değişkenlerini hosting sağlayıcınızda ayarlamanız **GEREKLİDİR**:

```
VITE_SUPABASE_URL=https://awzzjrlmuiropstoobcn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3enpqcmxtdWlyb3BzdG9vYmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MjkwMzQsImV4cCI6MjA4MzAwNTAzNH0.XhrJSnfKVARU7vhhYcQa0QarI0y37C8odmx3D2Owq3Q
```

## Netlify

1. Netlify Dashboard'a gidin
2. Site Settings > Build & Deploy > Environment bölümüne gidin
3. Yukarıdaki değişkenleri ekleyin
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Yeniden deploy edin

## Vercel

1. Vercel Dashboard'a gidin
2. Project Settings > Environment Variables bölümüne gidin
3. Yukarıdaki değişkenleri ekleyin
4. Build command: `npm run build`
5. Output directory: `dist`
6. Yeniden deploy edin

## Diğer Platformlar

Herhangi bir hosting platformunda:
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: Yukarıdaki değişkenleri ekleyin

## Beyaz Sayfa Sorunu

Eğer site beyaz sayfa gösteriyorsa:

1. **Tarayıcı cache'ini temizleyin**: Ctrl+Shift+R (Windows/Linux) veya Cmd+Shift+R (Mac)
2. **Environment variables kontrol edin**: Hosting sağlayıcınızda ortam değişkenlerinin doğru ayarlandığından emin olun
3. **Console loglarını kontrol edin**: Tarayıcıda F12 tuşuna basıp Console sekmesinde hata var mı bakın
4. **Yeniden deploy edin**: Değişiklikleri yaptıktan sonra mutlaka yeniden deploy edin

## Cache Temizleme

Değişiklik yaptıktan sonra sitenin güncel halini görmek için:
- **Chrome/Edge**: Ctrl+Shift+Delete > Cache'i temizle
- **Firefox**: Ctrl+Shift+Delete > Cache'i temizle
- **Safari**: Cmd+Option+E

Veya gizli pencerede (Incognito/Private) açın.

## Build Test

Yerel ortamda build'i test etmek için:

```bash
npm run build
npm run preview
```

Bu komutlar production build'ini oluşturur ve test sunucusunda çalıştırır.
