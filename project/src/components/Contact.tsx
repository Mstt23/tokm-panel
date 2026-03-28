import { useState } from 'react';
import { MapPin, Phone, Instagram, Map, MessageCircle, Mail, User, GraduationCap, Send } from 'lucide-react';
import { siteConfig } from '../config';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            name: formData.name,
            grade: formData.grade,
            phone: formData.phone,
            message: formData.message,
          },
        ]);

      if (error) throw error;

      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', grade: '', phone: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendViaWhatsApp = () => {
    const message = `Merhaba ${siteConfig.institutionName},\n\nAd Soyad: ${formData.name}\nÖğrencinin Sınıfı: ${formData.grade}\nTelefon: ${formData.phone}\nMesaj: ${formData.message}`;
    window.open(`${siteConfig.social.whatsappUrl}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            İletişime Geçin
          </h2>
          <p className="text-lg text-gray-600">
            Sorularınız için bize ulaşın
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              İletişim Bilgileri
            </h3>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Adres</h4>
                  <p className="text-gray-600">{siteConfig.address}</p>
                  <a
                    href={siteConfig.social.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary-dark mt-2 font-medium transition-smooth"
                  >
                    <Map className="w-4 h-4 mr-1" />
                    Haritada Aç
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Telefon</h4>
                  <a
                    href={`tel:${siteConfig.phone}`}
                    className="text-gray-600 hover:text-secondary transition-smooth"
                  >
                    {siteConfig.phoneFormatted}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Instagram</h4>
                  <a
                    href={siteConfig.social.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-secondary transition-smooth"
                  >
                    @{siteConfig.instagram}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">WhatsApp</h4>
                  <a
                    href={`${siteConfig.social.whatsappUrl}?text=${encodeURIComponent('Merhaba ' + siteConfig.institutionName + ', bilgi almak istiyorum.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-secondary transition-smooth"
                  >
                    Hemen mesaj gönderin
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4">Çalışma Saatleri</h4>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Hafta İçi</span>
                  <span className="font-medium">10:00 - 19:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Hafta Sonu</span>
                  <span className="font-medium">10:00 - 19:00</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl overflow-hidden shadow-sm">
              <iframe
                src="https://maps.google.com/maps?q=Tu%C4%9Fba+%C3%96zt%C3%BCrk+Vip+Kurs+Merkezi,+Osman+Gazi,+Termal+Sk.+No:2,+41700+Dar%C4%B1ca+Kocaeli&output=embed"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tuğba Öztürk Kurs Merkezi Konum"
              />
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Bilgi Talep Formu
              </h3>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  Mesajınız alındı! En kısa sürede size dönüş yapacağız.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  Bir hata oluştu. Lütfen tekrar deneyin.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                    placeholder="Adınız ve soyadınız"
                  />
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Öğrencinin Sınıfı
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                  >
                    <option value="">Seçiniz</option>
                    <option value="5. Sınıf">1. Sınıf</option>
                    <option value="5. Sınıf">2. Sınıf</option>
                    <option value="5. Sınıf">3. Sınıf</option>
                    <option value="5. Sınıf">4. Sınıf</option>
                    <option value="5. Sınıf">5. Sınıf</option>
                    <option value="6. Sınıf">6. Sınıf</option>
                    <option value="7. Sınıf">7. Sınıf</option>
                    <option value="8. Sınıf">8. Sınıf</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf">12. Sınıf</option>
                    <option value="Mezun">Mezun</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Mesajınız
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Bilgi almak istediğiniz programlar veya sorularınız..."
                  />
                </div>

                <div className="space-y-3">
                  {/*   <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-smooth hover-lift shadow-lg font-semibold text-lg disabled:bg-primary/50 disabled:transform-none"
                  >
                    <Send className="w-5 h-5" />
                    <span>{isSubmitting ? 'Gönderildi.' : 'Formu Gönder'}</span>
                  </button> */}

                  <button
                    type="button"
                    onClick={sendViaWhatsApp}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-primary text-white rounded-lg hover:bg-secondary-dark transition-smooth hover-lift shadow-lg font-semibold text-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp'tan Gönder</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
