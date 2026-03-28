import { Users, FileCheck, Heart } from 'lucide-react';
import { siteConfig } from '../config';

export default function SuccessStats() {
  /* İstatistik verileri */
  const stats = [
    {
      icon: Users,
      value: siteConfig.stats.students,
      label: 'Öğrenci',
      description: 'Başarıya giden yolda bizimle',
    },
    {
      icon: FileCheck,
      value: siteConfig.stats.exams,
      label: 'Deneme Sınavı',
      description: 'Düzenlenen toplam deneme sayısı',
    },
    {
      icon: Heart,
      value: siteConfig.stats.satisfaction,
      label: 'Memnuniyet',
      description: 'Öğrenci ve veli memnuniyet oranı',
    },
  ];

  return (
    /* Başarı istatistikleri bölümü */
    <section id="success" className="py-20 bg-gradient-to-br from-secondary to-secondary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Sayılarla Başarımız
          </h2>
          <p className="text-lg text-gray-100">
            Güvenilir eğitim anlayışımızın sonuçları
          </p>
        </div>

        {/* İstatistikler grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              /* Her bir istatistik kartı */
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center hover:bg-white/20 transition-smooth hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* İkon */}
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Sayı */}
                <div className="text-4xl sm:text-5xl font-bold mb-2">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-xl font-semibold mb-2">
                  {stat.label}
                </div>

                {/* Açıklama */}
                <p className="text-gray-100">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
