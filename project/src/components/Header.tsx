// İkonlar: WhatsApp mesaj balonu ve Instagram logosu
import { MessageCircle, Instagram } from 'lucide-react';
// Siteye ait ayarları config dosyasından alıyoruz
import { siteConfig } from '../config';

// Header bileşenini tanımlıyoruz
export default function Header() {

  // Navigasyon menüsündeki öğeler
  const navItems = [
   { label: 'Hakkımızda', href: '#about' },
    { label: 'Programlar', href: '#programs' },
    { label: 'Galeri', href: '#gallery' },
    { label: 'Duyurular', href: '#announcements' },
    { label: 'Neden Biz', href: '#why-us' },
    { label: 'Başarılar', href: '#success' },
    { label: 'Yorumlar', href: '#testimonials' },
    { label: 'SSS', href: '#faq' },
    { label: 'İletişim', href: '#contact' },
  ];

  // Sayfadaki ilgili bölüme kaydırma fonksiyonu
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Header alanı */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-transparent">

        {/* İçerik genişliği ayarı */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header içindeki düzen: sol, orta, sağ */}
          <div className="flex justify-between items-center py-5">
            {/* Sol kısım: kurum adı */}
            <div className="flex-1">
              <button
                onClick={() => scrollToSection('#home')}
                className="hover:opacity-80 transition-opacity text-xs font-bold tracking-wider text-white"
              >
                {siteConfig.institutionName.toUpperCase()}
              </button>
            </div>

            {/* Orta kısım: menü öğeleri (xl ekranlarda görünür) */}
            <nav className="hidden xl:flex items-center space-x-6 flex-1 justify-center">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="text-xs font-medium hover:underline transition-all text-white"
                >
                  {item.label}
                </button>
              ))}
            </nav>


              {/* Ayırıcı çizgi */}
              <div className="w-px h-8 bg-white/30 mx-5"></div>
            
            {/* Sağ kısım: sosyal medya ve iletişim */}
            <div className="hidden xl:flex items-center space-x-3 ml-auto">
              {/* WhatsApp butonu */}
              <a
                href={`${siteConfig.social.whatsappUrl}?text=${encodeURIComponent('Merhaba ' + siteConfig.institutionName + ', bilgi almak istiyorum.')}`}
                target="_blank"
                rel="noopener noreferrer"
               className="flex items-center space-x-2 px-4 py-2 border-2 rounded-lg transition-smooth border-white text-white hover:bg-[#25D366] hover:text-white hover:opacity-80"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Mesaj At</span>
              </a>

              {/* Instagram butonu */}
              <a
                href={siteConfig.social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border-2 rounded-lg transition-smooth border-white text-white hover:bg-gradient-to-r hover:from-pink-500 hover:via-red-500 hover:to-purple-600 hover:text-white hover:opacity-80"
              >
                <Instagram className="w-4 h-4" />
                <span className="text-xs font-medium">Takip Et</span>
              </a>


             
            </div>
          </div>
        </div>
      </header>
    </>
  );
}