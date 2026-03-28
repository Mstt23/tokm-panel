import { ChevronDown } from 'lucide-react';

export default function Hero() {
  return (
    /* Ana hero bölümü - tam ekran yüksekliği */
    <section id="home" className="relative h-screen w-full overflow-hidden">

      {/* Arka plan görseli */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/backgroundimage.png')"
        }}
      >
        {/* Karanlık gradient overlay - içeriği daha okunabilir yapar */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      {/* Ana başlık içeriği */}
      <div className="relative h-full flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* Büyük başlık - animasyonlu */}
          <div className="big-title mb-8">
            <span className="block text-6xl sm:text-7xl lg:text-9xl font-bold text-white leading-tight in-from-left slide-in-left">
              Tuğba
            </span>
            <span className="block text-6xl sm:text-7xl lg:text-9xl font-bold text-white leading-tight in-from-right slide-in-left">
              Öztürk
            </span>
            <span className="block text-6xl sm:text-7xl lg:text-9xl font-bold text-white leading-tight second-left slide-in-right">
              Eğitim Kurumları
            </span>
          </div>
        </div>
      </div>

      {/* Alt slogan metni */}
      <p className="absolute bottom-8 left-4 sm:left-8 lg:left-16 text-lg sm:text-xl lg:text-2xl text-white/90 font-light max-w-md" style={{ opacity: 0, animation: 'slideInFromLeft 1s ease-out 0.9s forwards' }}>
        Hedeflerinize Giden Yolda Yanınızdayız
      </p>

      {/* Aşağı ok ikonu - zıplama animasyonlu */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/70" />
      </div>

    </section>
  );
}
