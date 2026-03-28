import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  /* Açık olan sorunun index'i */
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  /* Sıkça sorulan sorular listesi */
  const faqs = [
    {
      question: 'Kayıt süreci nasıl işliyor?',
      answer: 'Kayıt için öncelikle ön görüşme yapmanız gerekmektedir. Bu görüşmede öğrencinin durumu, ihtiyaçları ve hedefleri değerlendirilir. Ardından seviye belirleme testi yapılır ve uygun program önerilir. Kayıt işlemleri için gerekli evraklar: Nüfus cüzdanı fotokopisi, 2 adet vesikalık fotoğraf ve öğrenci belgesi.',
    },
    {
      question: 'Program yapısı nasıldır?',
      answer: 'Programlarımız haftalık ders saatleri, düzenli deneme sınavları ve bireysel takip sisteminden oluşur. Her öğrenci için özel çalışma planı hazırlanır. Hafta içi ve hafta sonu seçenekleri mevcuttur. Dersler küçük gruplar halinde işlenerek her öğrenciye maksimum ilgi gösterilir.',
    },
    {
      question: 'Deneme sınavları ne sıklıkta yapılır?',
      answer: 'TYT ve AYT denemeleri haftalık olarak düzenlenir. Deneme sonuçları Öğrenci Koçu aracılığı ile yüzyüze öğrenciyle görüşülür ve detaylı analizler öğrencilerimize ve velilerimize  dijital ortamda sunulur. Analizlerde konu bazlı eksiklikler belirlenir ve çalışma programı buna göre güncellenir.',
    },
    {
      question: 'Veli bilgilendirme sistemi nasıl çalışır?',
      answer: 'Velilerimiz dönem içinde düzenli olarak bilgilendirilir. Aylık veli görüşmeleri düzenlenir. Ayrıca öğrencinin devam durumu, deneme sonuçları ve genel başarı durumu hakkında anlık bildirimler gönderilir. Gerektiğinde birebir görüşmeler yapılır.',
    },
    {
      question: 'Seviye belirleme testi zorunlu mu?',
      answer: 'Evet, her öğrencimiz kayıt sırasında seviye belirleme testine tabi tutulur. Bu test ile öğrencinin mevcut durumu, güçlü ve zayıf yönleri tespit edilir. Test sonuçlarına göre en uygun program ve çalışma planı oluşturulur.',
    },
    {
      question: 'Çalışma saatleri nasıl düzenleniyor?',
      answer: 'Kütüphanemiz hafta içi ve hafta sonu her gün 10:00-19:00 saatleri arasında öğrencilerimize açıktır. Ders saatleri öğrencinin okul programına göre düzenlenir. Etüt saatleri ise esnek olup öğrencinin ihtiyacına göre planlanır.',
    },
  ];

  return (
    /* SSS bölümü */
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Sıkça Sorulan Sorular
          </h2>
          <p className="text-lg text-gray-600">
            Merak ettiklerinizin yanıtları
          </p>
        </div>

        {/* Sorular listesi */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-smooth animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Soru başlığı - tıklanabilir */}
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-primary/5 transition-smooth"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {/* Cevap metni - açıksa göster */}
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600 animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
