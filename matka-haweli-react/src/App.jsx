import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ToastProvider } from './context/ToastContext';
import LoadingScreen from './components/LoadingScreen';
import EmberParticles from './components/EmberParticles';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Specials from './components/Specials';
import Menu from './components/Menu';
import Gallery from './components/Gallery';
import About from './components/About';
import Testimonial from './components/Testimonial';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import OrderPanel from './components/OrderPanel';
import OrderButton from './components/OrderButton';
import OrderHistoryModal from './components/OrderHistoryModal';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <OrderProvider>
      <EmberParticles />
      <Navbar />
      <Hero />
      <div className="fire-divider" />
      <Specials />
      <div className="fire-divider" />
      <Menu />
      <div className="fire-divider" />
      <Gallery />
      <div className="fire-divider" />
      <About />
      <Testimonial />
      <div className="fire-divider" />
      <Contact />
      <Footer />

      {/* Order system overlays */}
      <LoginModal />
      <OrderPanel />
      <OrderButton />
      <OrderHistoryModal />
    </OrderProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
