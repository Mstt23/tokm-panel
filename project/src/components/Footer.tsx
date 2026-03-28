import { useState } from 'react';
import { MapPin, Phone, Instagram, X } from 'lucide-react';
import { siteConfig } from '../config';

export default function Footer() {
  const [showKVKK, setShowKVKK] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookie, setShowCookie] = useState(false);

  const quickLinks = [
    { label: 'Ana Sayfa', href: '#home' },
    { label: 'Programlar', href: '#programs' },
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
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4">
              {siteConfig.institutionName}
            </h3>
            <p className="text-gray-400 mb-4">
              Başarıya giden yolda öğrencilerimizle birlikte ilerliyoruz.
            </p>
            <a
              href={siteConfig.social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span>@{siteConfig.instagram}</span>
            </a>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">İletişim</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-400">{siteConfig.address}</span>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-smooth"
                >
                  <Phone className="w-5 h-5 text-secondary" />
                  <span>{siteConfig.phoneFormatted}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} {siteConfig.institutionName}. Tüm hakları saklıdır.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => setShowKVKK(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              KVKK Aydınlatma Metni
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Gizlilik Politikası
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => setShowCookie(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Çerez Politikası
            </button>
          </div>
        </div>
      </div>

      {showKVKK && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                KVKK Aydınlatma Metni
              </h2>
              <button
                onClick={() => setShowKVKK(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 text-gray-700 space-y-4">
              <p>
                <strong>{siteConfig.institutionName}</strong> olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu
                kapsamında kişisel verilerinizin güvenliği konusunda azami hassasiyeti göstermekteyiz.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Veri Sorumlusu</h3>
              <p>
                Kişisel verileriniz, veri sorumlusu sıfatıyla {siteConfig.institutionName} tarafından aşağıda
                açıklanan kapsamda işlenebilecektir.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">İşlenen Kişisel Veriler</h3>
              <p>
                Kurumumuza kayıt olurken veya iletişime geçerken; ad-soyad, telefon numarası, öğrenim bilgileri ve
                diğer ilgili bilgileriniz toplanabilmektedir.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Kişisel Verilerin İşlenme Amacı</h3>
              <p>
                Toplanan kişisel verileriniz; eğitim hizmetlerinin sunulması, veli bilgilendirme, iletişim,
                kayıt işlemleri ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Haklarınız</h3>
              <p>
                KVKK kapsamında, kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,
                işlenme amacını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,
                eksik veya yanlış işlenmişse düzeltilmesini isteme, KVKK'da öngörülen şartlar çerçevesinde
                silinmesini veya yok edilmesini isteme haklarına sahipsiniz.
              </p>

              <p className="mt-6 text-sm text-gray-500">
                Daha detaylı bilgi için {siteConfig.address} adresinden veya {siteConfig.phoneFormatted} numaralı
                telefondan bizimle iletişime geçebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Gizlilik Politikası
              </h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 text-gray-700 space-y-4">
              <p>
                <strong>{siteConfig.institutionName}</strong> olarak gizliliğinize önem veriyoruz.
                Bu politika, web sitemizi ziyaret ettiğinizde toplanan bilgilerin nasıl kullanıldığını açıklar.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Toplanan Bilgiler</h3>
              <p>
                Web sitemizi kullanırken ad, soyad, telefon numarası, e-posta adresi ve öğrenim bilgileri
                gibi kişisel bilgilerinizi toplayabiliriz. Bu bilgiler sadece sizinle iletişim kurmak
                ve hizmetlerimizi sunmak amacıyla kullanılır.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Bilgilerin Kullanımı</h3>
              <p>
                Topladığımız bilgiler şu amaçlarla kullanılır:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Eğitim hizmetlerimizi sunmak ve geliştirmek</li>
                <li>Sizinle iletişim kurmak ve bilgilendirme yapmak</li>
                <li>Kayıt işlemlerini gerçekleştirmek</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Bilgi Güvenliği</h3>
              <p>
                Kişisel bilgilerinizin güvenliğini sağlamak için uygun teknik ve idari önlemleri alıyoruz.
                Bilgileriniz yetkisiz erişime, kayba veya kötüye kullanıma karşı korunmaktadır.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Üçüncü Taraflarla Paylaşım</h3>
              <p>
                Kişisel bilgileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz.
              </p>

              <p className="mt-6 text-sm text-gray-500">
                Sorularınız için {siteConfig.address} adresinden veya {siteConfig.phoneFormatted} numaralı
                telefondan bizimle iletişime geçebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {showCookie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Çerez Politikası
              </h2>
              <button
                onClick={() => setShowCookie(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 text-gray-700 space-y-4">
              <p>
                <strong>{siteConfig.institutionName}</strong> web sitesi, kullanıcı deneyimini iyileştirmek
                için çerezler kullanmaktadır.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Çerez Nedir?</h3>
              <p>
                Çerezler, web sitelerinin kullanıcıların cihazlarında sakladığı küçük metin dosyalarıdır.
                Bu dosyalar, web sitesinin daha verimli çalışmasını ve kullanıcı deneyiminin
                iyileştirilmesini sağlar.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Kullandığımız Çerezler</h3>
              <p>
                Web sitemizde aşağıdaki çerez türlerini kullanmaktayız:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Zorunlu Çerezler:</strong> Web sitesinin temel işlevlerini yerine getirmesi için gereklidir</li>
                <li><strong>Performans Çerezleri:</strong> Web sitesinin nasıl kullanıldığını anlamamıza yardımcı olur</li>
                <li><strong>İşlevsellik Çerezleri:</strong> Tercihlerinizi hatırlamamızı sağlar</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Çerezleri Kontrol Etme</h3>
              <p>
                Tarayıcı ayarlarınızdan çerezleri kontrol edebilir, silebilir veya engelleyebilirsiniz.
                Ancak bazı çerezleri engellemek, web sitesinin bazı özelliklerinin düzgün çalışmamasına
                neden olabilir.
              </p>

              <p className="mt-6 text-sm text-gray-500">
                Çerez politikamız hakkında daha fazla bilgi için {siteConfig.phoneFormatted} numaralı
                telefondan bizimle iletişime geçebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
