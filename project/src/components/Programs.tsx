import { GraduationCap, BookOpen, Users, Library, FileCheck, MessageCircle } from 'lucide-react';
import { siteConfig } from '../config';

export default function Programs() {
  const programs = [
    {
      icon: GraduationCap,
      title: 'TYT / AYT Hazırlık',
      description: 'Kapsamlı konu anlatımı, düzenli deneme sınavları ve bireysel performans takibi ile üniversite sınavına hazırlık.',
      features: ['Haftalık deneme sınavları', 'Konu eksikliği analizi', 'Birebir rehberlik'],
    },
    {
      icon: BookOpen,
      title: '9-12. Sınıf Okul Destek',
      description: 'Okul müfredatına uygun destek programı ile ders başarınızı artırın ve sınavlara hazırlanın.Ara grup denemeleri ile kendinizi takip edin.',
      features: ['Konu takviye dersleri', 'Sınav hazırlığı', 'Ödev desteği'],
    },
    {
      icon: Users,
      title: 'Ortaokul Takviye',
      description: 'Temel konuların pekiştirilmesi ve akademik başarının artırılması için ortaokul öğrencilerine özel program.',
      features: ['Küçük grup çalışmaları', 'İnteraktif dersler', 'Düzenli veli bilgilendirme'],
    },
    {
      icon: Users,
      title: 'İlkokul Ödev Çözüm Grubu',
      description: 'İlkokul 1-4.Sınıf öğrenciler için ödev çözümü ve takviye programı .',
      features: ['Günlük ödev çözümleri', 'Eksik konu takviyesi', 'Aylık ilerleme raporu'],
    },

    {
      icon: Library,
      title: 'Etüt & Kütüphane',
      description: 'Sessiz ve üretken çalışma ortamı. Rehber öğretmen gözetiminde etüt desteği.',
      features: ['7/24 kütüphane erişimi', 'Gözetimli etüt saatleri', 'Kaynak desteği'],
    },
    {
      icon: FileCheck,
      title: 'Deneme Sınavları ve Analiz',
      description: 'Düzenli deneme sınavları ve detaylı performans analizleri ile gelişiminizi takip edin.',
      features: ['TYT-AYT denemeleri', 'Konu bazlı analiz', 'Başarı raporları'],
    },
     
  ];

  const getWhatsAppLink = (programTitle: string) => {
    const message = `Merhaba, "${programTitle}" programı hakkında bilgi almak istiyorum.`;
    return `${siteConfig.social.whatsappUrl}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="programs" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Eğitim Programlarımız
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Her öğrencinin ihtiyacına uygun, kapsamlı ve sonuç odaklı eğitim programları
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => {
            const Icon = program.icon;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover-lift animate-slide-up group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-smooth">
                  <Icon className="w-8 h-8 text-primary group-hover:text-white transition-smooth" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {program.title}
                </h3>

                <p className="text-gray-600 mb-4">
                  {program.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={getWhatsAppLink(program.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-smooth font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Bilgi Al</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
