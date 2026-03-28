import { useState, useEffect } from 'react';
import { Users, Award, BookOpen, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AboutUsContent {
  id: string;
  content: string;
  is_active: boolean;
}

export default function AboutUs() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const fetchAboutUs = async () => {
    try {
      const { data, error } = await supabase
        .from('about_us')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching about us:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Deneyimli Kadro',
      description: 'Alanında uzman öğretmenlerimiz',
    },
    {
      icon: Award,
      title: 'Kanıtlanmış Başarı',
      description: 'Yüksek başarı oranları',
    },
    {
      icon: BookOpen,
      title: 'Modern Eğitim',
      description: 'Güncel müfredat ve materyaller',
    },
    {
      icon: Target,
      title: 'Hedef Odaklı',
      description: 'Kişiselleştirilmiş eğitim planları',
    },
  ];

  if (loading) {
    return (
      <section id="about" className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Hakkımızda
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-600 transition-colors">
                <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
