import { useState, useEffect } from 'react';
import { Megaphone, Calendar, X, MessageCircle } from 'lucide-react';
import { supabase, Announcement } from '../lib/supabase';
import { siteConfig } from '../config';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Deneme', 'Program', 'Duyuru'];

  const filteredAnnouncements = filter === 'all'
    ? announcements
    : announcements.filter(a => a.category === filter);

  const displayedAnnouncements = filteredAnnouncements.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Deneme':
        return 'bg-blue-100 text-blue-700';
      case 'Program':
        return 'bg-green-100 text-green-700';
      case 'Duyuru':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section id="announcements" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Duyurular & Güncel Bilgiler
          </h2>
          <p className="text-lg text-gray-600">
            Kurumumuzdan en güncel haberler
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category === 'all' ? 'Tümü' : category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Henüz yayınlanmış bir duyuru bulunmamaktadır.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayedAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer overflow-hidden group"
                  onClick={() => setSelectedAnnouncement(announcement)}
                >
                  {announcement.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                            announcement.category
                          )}`}
                        >
                          {announcement.category}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    {!announcement.image_url && (
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                            announcement.category
                          )}`}
                        >
                          {announcement.category}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(announcement.date)}
                        </div>
                      </div>
                    )}

                    {announcement.image_url && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(announcement.date)}
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {announcement.title}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {announcement.summary}
                    </p>

                    <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                      Devamını Oku →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredAnnouncements.length > 3 && (
              <div className="text-center">
                <button
                  onClick={() => setFilter('all')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Tüm Duyuruları Gör
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div className="flex-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(
                    selectedAnnouncement.category
                  )}`}
                >
                  {selectedAnnouncement.category}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(selectedAnnouncement.date)}
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {selectedAnnouncement.image_url && (
                <img
                  src={selectedAnnouncement.image_url}
                  alt={selectedAnnouncement.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              <p className="text-gray-700 whitespace-pre-line mb-6">
                {selectedAnnouncement.content}
              </p>

              <a
                href={`${siteConfig.social.whatsappUrl}?text=${encodeURIComponent(`Merhaba, "${selectedAnnouncement.title}" hakkında bilgi almak istiyorum.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{selectedAnnouncement.cta}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
