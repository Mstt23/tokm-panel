import { useEffect, useState, Component, ReactNode } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import Programs from './components/Programs';
import Gallery from './components/Gallery';
import Announcements from './components/Announcements';
import WhyUs from './components/WhyUs';
import SuccessStats from './components/SuccessStats';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import AdminPanel from './components/admin/AdminPanel';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import DersProgramiStandalonePage from './components/admin/DersProgramiStandalonePage';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Bir Hata Oluştu</h1>
            <p className="text-gray-600 mb-4">
              Sayfa yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
            </p>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function isDersProgramiPath(pathname: string) {
  return pathname === '/admin/ders-programi' || pathname.startsWith('/admin/ders-programi/');
}

function App() {
  const [adminView, setAdminView] = useState<'none' | 'panel' | 'ders-programi'>(() => {
    if (typeof window === 'undefined') return 'none';
    const path = window.location.pathname;
    if (isDersProgramiPath(path)) return 'ders-programi';
    if (path.startsWith('/admin')) return 'panel';
    return 'none';
  });

  useEffect(() => {
    const sync = () => {
      const path = window.location.pathname;
      if (isDersProgramiPath(path)) setAdminView('ders-programi');
      else if (path.startsWith('/admin')) setAdminView('panel');
      else setAdminView('none');
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  if (adminView === 'ders-programi') {
    return (
      <ErrorBoundary>
        <AdminAuthProvider>
          <DersProgramiStandalonePage />
        </AdminAuthProvider>
      </ErrorBoundary>
    );
  }

  if (adminView === 'panel') {
    return (
      <ErrorBoundary>
        <AdminPanel />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Hero />
          <AboutUs />
          <Programs />
          <Gallery />
          <Announcements />
          <WhyUs />
          <SuccessStats />
          <Testimonials />
          <FAQ />
          <Contact />
        </main>
        <Footer />
        <FloatingButtons />
      </div>
    </ErrorBoundary>
  );
}

export default App;
