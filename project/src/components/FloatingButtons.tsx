import { useState } from 'react';
import { Menu, Search, X, Phone, MapPin,Instagram,MessageCircle } from 'lucide-react';
import { siteConfig } from '../config';


export default function FloatingButtons() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

   const navItems = [
    { label: 'Ana Sayfa', href: '#home' },
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

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* Sağ tarafta sabit duran sidebar */}
      <div className="fixed right-0 top-20 bottom-0 w-15 bg backdrop flex flex-col items-center justify-start  rounded-l-xl shadow-lg">
        <div className="flex flex-col items-center space-y-8">
          {/* Menü butonu: durumuna göre Menu veya X gösterir */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col items-center justify-center space-y-2 hover:opacity-80 transition-all group"
          >
            {isMenuOpen ? (
              <>
                <X className="w-7 h-7 text-gray-500" />
                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">Kapat</span>
              </>
            ) : (
              <>
                <Menu className="w-7 h-7 text-white" />
                <span className="text-[11px] font-semibold text-white tracking-wide">Menu</span>
              </>
            )}
          </button>

          {/* butonlar sadece panel kapalıyken görünür */}
      
           {!isMenuOpen && (
            <a
              href={siteConfig.social.instagramUrl}
               target="_blank"
                rel="noopener noreferrer"
              className="flex flex-col items-center  justify-center space-y-2 hover:opacity-80 transition-all group">
              <Instagram className="w-7 h-7 text-white " />
              <span className="text-[11px] font-semibold text-white tracking-wide">Takip Et</span>
            </a>
          )}
           {!isMenuOpen && (
            <a 
                href={`${siteConfig.social.whatsappUrl}?text=${encodeURIComponent('Merhaba ' + siteConfig.institutionName + ', bilgi almak istiyorum.')}`}
               target="_blank"
                rel="noopener noreferrer"
              className="flex flex-col items-center justify-center space-y-2 hover:opacity-80 transition-all group">
              <MessageCircle className="w-7 h-7 text-white" />
              <span className="text-[11px] font-semibold text-white tracking-wide">Mesaj At</span>
            </a>
          )}
           
        </div>

          <div className="mt-auto mb-4">
          <a href="#home">
          <img src="/logo-icon.png" alt="Logo" className="w-14 h-14 cursor-pointer" />
          </a>
          </div>
        
        
      </div>

      {/* Menü paneli */}
      {isMenuOpen && (
        <div className="fixed top-20 right-0 bottom-0 w-auto sm:w-96 bg-white/80 backdrop-blur-md z-30 rounded-l-xl shadow-2xl animate-slide-in-right">
          <div className="h-full flex flex-col justify-between">
            
            {/* Menü linkleri */}
            <nav className="p-6 flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left px-4 py-2 text-base text-gray-900 hover:bg-primary/5 hover:text-primary hover:underline rounded-lg transition-smooth font-medium"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Alt kısım: WhatsApp + adres + telefon */}
            <div className="p-6 border-t border-gray-200 flex flex-col items-center space-y-3">
              <a
                href={siteConfig.social.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border-2 rounded-lg transition-smooth border-gray text-gray hover:bg-[#25D366] hover:text-white hover:opacity-80"
              >
                WhatsApp'tan Yazın
              </a>

              <a
                href={siteConfig.social.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-smooth"
              >
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span className="text-left">{siteConfig.address}</span>
              </a>

              <a
                href={`tel:${siteConfig.phone}`}
                className="flex items-center space-x-2 text-lg font-semibold text-blue-600 hover:text-blue-700 underline transition-smooth"
              >
                <Phone className="w-5 h-5" />
                <span>{siteConfig.phoneFormatted}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}