import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { supabase, Testimonial } from '../lib/supabase';

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(testimonials[(currentIndex + i) % testimonials.length]);
    }
    return visible;
  };

  if (loading) {
    return (
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Öğrenci ve Velilerimizden Yorumlar
            </h2>
            <p className="text-lg text-gray-600">
              Başarı hikayelerinin en değerli tanıkları
            </p>
          </div>
          <div className="text-center py-12 bg-white rounded-xl">
            <Quote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Henüz yorum eklenmemiştir.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Öğrenci ve Velilerimizden Yorumlar
          </h2>
          <p className="text-lg text-gray-600">
            Başarı hikayelerinin en değerli tanıkları
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
            {getVisibleTestimonials().map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover-lift animate-slide-up"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {testimonial.image_url ? (
                      <img
                        src={testimonial.image_url}
                        alt={testimonial.student_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <Quote className="w-10 h-10 text-primary/20" />
                    )}
                  </div>
                  <span className="px-2 py-1 bg-accent/20 text-accent-dark text-xs rounded-full">
                    {testimonial.student_grade}
                  </span>
                </div>

                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-700 mb-4 min-h-[100px]">
                  "{testimonial.content}"
                </p>

                <div>
                  <div className="font-semibold text-gray-900">{testimonial.student_name}</div>
                  <div className="text-sm text-gray-500">{testimonial.student_grade}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="md:hidden mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {testimonials[currentIndex].image_url ? (
                    <img
                      src={testimonials[currentIndex].image_url}
                      alt={testimonials[currentIndex].student_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <Quote className="w-10 h-10 text-primary/20" />
                  )}
                </div>
                <span className="px-2 py-1 bg-accent/20 text-accent-dark text-xs rounded-full">
                  {testimonials[currentIndex].student_grade}
                </span>
              </div>

              <div className="flex mb-3">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              <p className="text-gray-700 mb-4">
                "{testimonials[currentIndex].content}"
              </p>

              <div>
                <div className="font-semibold text-gray-900">{testimonials[currentIndex].student_name}</div>
                <div className="text-sm text-gray-500">{testimonials[currentIndex].student_grade}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={prevSlide}
              className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-smooth hover:bg-primary/5"
              aria-label="Önceki yorum"
            >
              <ChevronLeft className="w-6 h-6 text-primary" />
            </button>
            <button
              onClick={nextSlide}
              className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-smooth hover:bg-primary/5"
              aria-label="Sonraki yorum"
            >
              <ChevronRight className="w-6 h-6 text-primary" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-smooth ${
                  index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-gray-300'
                }`}
                aria-label={`Yorum ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
