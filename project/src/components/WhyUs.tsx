import { Award, Calendar, Users, TrendingUp, Library } from 'lucide-react';

export default function WhyUs() {
  /* Neden biz seçenekleri */
  const reasons = [
    {
      icon: Award,
      title: 'Deneyimli Eğitim Kadrosu',
      description: 'Alanında uzman, deneyimli öğretmenlerimiz ile kaliteli eğitim anlayışı.',
    },
    {
      icon: Calendar,
      title: 'Planlı Takip Sistemi',
      description: 'Her öğrenci için özel hazırlanan çalışma planı ve düzenli ilerleme takibi.',
    },
    {
      icon: Users,
      title: 'Veli Bilgilendirme',
      description: 'Düzenli veli toplantıları ve anlık bilgilendirmeler ile şeffaf iletişim.',
    },
    {
      icon: TrendingUp,
      title: 'Ölçme & Değerlendirme',
      description: 'Düzenli deneme sınavları ve detaylı performans analizi ile gelişim takibi.',
    },
    {
      icon: Library,
      title: 'Disiplinli Çalışma Ortamı',
      description: 'Verimli çalışma için tasarlanmış sessiz ve konforlu kütüphane ve derslikler.',
    },
  ];

  return (
    /* Neden Biz bölümü */
    <section id="why-us" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Neden Tuğba Öztürk Kurs Merkezi?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Başarıya ulaşmanız için sunduğumuz farklar
          </p>
        </div>

        {/* Özellikler grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              /* Her bir özellik kartı */
              <div
                key={index}
                className="bg-gradient-to-br from-primary/5 to-white rounded-xl p-8 hover-lift border border-primary/20 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* İkon */}
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Başlık */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {reason.title}
                </h3>

                {/* Açıklama */}
                <p className="text-gray-600">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
