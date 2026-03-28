import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, GalleryImage } from '../lib/supabase';

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.pageX - startX;
    setTranslateX(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX > 100) {
      goToPrevious();
    } else if (translateX < -100) {
      goToNext();
    }

    setTranslateX(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].pageX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX > 100) {
      goToPrevious();
    } else if (translateX < -100) {
      goToNext();
    }

    setTranslateX(0);
  };

  const getImageIndex = (offset: number) => {
    const index = currentIndex + offset;
    if (index < 0) return images.length + index;
    if (index >= images.length) return index - images.length;
    return index;
  };

  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Galeri
          </h2>
          <p className="text-lg text-gray-600">
            Kurs merkezimizden fotoğraflar
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Henüz galeri fotoğrafı eklenmemiştir.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={carouselRef}
              className="relative overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex items-center justify-center gap-4 py-8">
                <div
                  className="flex items-center justify-center gap-4 transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(${translateX}px)`,
                  }}
                >
                  <div
                    className="hidden md:block flex-shrink-0 w-64 h-64 rounded-xl overflow-hidden opacity-50 cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={goToPrevious}
                  >
                    <img
                      src={images[getImageIndex(-1)]?.image_url}
                      alt={images[getImageIndex(-1)]?.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>

                  <div className="flex-shrink-0 w-full md:w-[500px] h-[400px] rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing">
                    <img
                      src={images[currentIndex]?.image_url}
                      alt={images[currentIndex]?.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>

                  <div
                    className="hidden md:block flex-shrink-0 w-64 h-64 rounded-xl overflow-hidden opacity-50 cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={goToNext}
                  >
                    <img
                      src={images[getImageIndex(1)]?.image_url}
                      alt={images[getImageIndex(1)]?.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
              aria-label="Önceki"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
              aria-label="Sonraki"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>

            <div className="text-center mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {images[currentIndex]?.title}
              </h3>
              <p className="text-gray-600">{images[currentIndex]?.category}</p>
              <div className="flex justify-center gap-2 mt-6">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-blue-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`${index + 1}. fotoğrafa git`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
