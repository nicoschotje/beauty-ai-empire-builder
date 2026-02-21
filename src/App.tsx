import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Info, 
  Layout,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  ShieldCheck,
  HelpCircle,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { SLIDES, SlideContent } from './constants';

const COLORS = {
  plum: '#4A1942',
  midnight: '#0D1B2A',
  roseGold: '#E8B4CB',
  champagne: '#F7E7CE',
  lavender: '#C8A2C8',
  pearl: '#F8F4E6',
};

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'f') toggleFullscreen();
      if (e.key === 'n') setShowNotes(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#050505] text-[#F8F4E6] font-sans selection:bg-[#E8B4CB] selection:text-[#4A1942] overflow-hidden flex flex-col">
      {/* Header / Progress */}
      <header className="p-4 flex justify-between items-center z-50 bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A1942] to-[#0D1B2A] border border-[#E8B4CB]/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#E8B4CB]">BAE</span>
          </div>
          <div>
            <h1 className="text-xs font-semibold tracking-widest uppercase opacity-80">Beauty AI Empire</h1>
            <p className="text-[10px] opacity-50">Sales Presentation v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#E8B4CB] to-[#F7E7CE]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono opacity-60">{currentSlide + 1} / {SLIDES.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-colors ${showNotes ? 'bg-[#E8B4CB] text-[#4A1942]' : 'hover:bg-white/10'}`}
              title="Toggle Speaker Notes (N)"
            >
              <Info size={18} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Slide Area */}
      <main className="flex-1 relative flex items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-6xl aspect-video bg-[#0D1B2A] rounded-3xl shadow-2xl overflow-hidden relative border border-white/10"
            style={{
              background: currentSlide === 0 || currentSlide === 12 || currentSlide === 13 
                ? `linear-gradient(135deg, ${COLORS.plum} 0%, ${COLORS.midnight} 100%)`
                : currentSlide % 2 === 0 ? COLORS.midnight : '#1a1a1a'
            }}
          >
            {/* Slide Content Renderer */}
            <SlideRenderer slide={slide} />
            
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
              <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E8B4CB] blur-[100px]" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#4A1942] blur-[100px]" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8 pointer-events-none">
          <button 
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`pointer-events-auto p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all ${currentSlide === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110 active:scale-95'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
            className={`pointer-events-auto p-4 rounded-full bg-[#E8B4CB] text-[#4A1942] shadow-lg shadow-[#E8B4CB]/20 transition-all ${currentSlide === SLIDES.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </main>

      {/* Speaker Notes Drawer */}
      <AnimatePresence>
        {showNotes && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-[#F8F4E6] text-[#0D1B2A] p-6 z-[60] rounded-t-3xl shadow-2xl border-t border-[#E8B4CB]/30"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif italic text-xl">Speaker Notes</h3>
                <button onClick={() => setShowNotes(false)} className="opacity-50 hover:opacity-100">
                  <ChevronRight className="rotate-90" />
                </button>
              </div>
              <p className="text-lg leading-relaxed font-medium">
                {slide.speakerNotes}
              </p>
              <div className="mt-4 flex gap-2">
                <span className="px-2 py-1 bg-[#4A1942]/10 rounded text-[10px] font-bold uppercase tracking-wider text-[#4A1942]">Visual Direction</span>
                <p className="text-xs opacity-70 italic">{slide.visualDirection}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-4 text-center text-[10px] opacity-30 uppercase tracking-[0.2em]">
        © 2026 Beauty AI Empire Builder • All Rights Reserved • Commercial License Included
      </footer>
    </div>
  );
}

function SlideRenderer({ slide }: { slide: SlideContent }) {
  switch (slide.id) {
    case 1: return <TitleSlide slide={slide} />;
    case 2: return <ProblemSlide slide={slide} />;
    case 3: return <GridSlide slide={slide} />;
    case 4: return <StepsSlide slide={slide} />;
    case 5: return <ProofSlide slide={slide} />;
    case 6: return <PersonaSlide slide={slide} />;
    case 7: return <RevenueSlide slide={slide} />;
    case 8: return <ValueSlide slide={slide} />;
    case 9: return <FeaturesSlide slide={slide} />;
    case 10: return <TrustSlide slide={slide} />;
    case 11: return <FAQSlide slide={slide} />;
    case 12: return <PricingSlide slide={slide} />;
    case 13: return <UrgencySlide slide={slide} />;
    case 14: return <ClosingSlide slide={slide} />;
    default: return <DefaultSlide slide={slide} />;
  }
}

function TitleSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-12">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 px-4 py-1 border border-[#E8B4CB]/50 rounded-full text-[10px] font-bold tracking-[0.3em] uppercase text-[#E8B4CB]"
      >
        Commercial License Included
      </motion.div>
      <h2 className="font-serif text-6xl md:text-8xl mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#F7E7CE] to-[#E8B4CB]">
        {slide.title}
      </h2>
      <p className="text-xl md:text-2xl opacity-80 max-w-3xl font-light tracking-wide mb-12">
        {slide.subtitle}
      </p>
      <div className="flex gap-4">
        {slide.body.map((text, i) => (
          <span key={i} className="text-sm font-medium opacity-60 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProblemSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col justify-center p-16">
      <h2 className="font-serif text-4xl mb-12 max-w-2xl leading-tight text-[#E8B4CB]">
        {slide.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {slide.body.map((text, i) => (
          <div key={i} className="flex items-start gap-4 group">
            <div className="mt-1 p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
              <AlertCircle size={20} />
            </div>
            <p className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-8 border-t border-white/10 italic text-xl opacity-60 font-serif">
        "What if you could access 7-figure brand strategies instantly — for less than a dinner out?"
      </div>
    </div>
  );
}

function GridSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col p-12">
      <div className="mb-12">
        <h2 className="font-serif text-4xl mb-2 text-[#F7E7CE]">{slide.title}</h2>
        <p className="opacity-60 text-lg">{slide.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        {slide.body.map((text, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-full bg-[#E8B4CB]/10 flex items-center justify-center text-[#E8B4CB] mb-4">
              <Zap size={20} />
            </div>
            <p className="font-medium leading-tight">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepsSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-16 bg-[#F8F4E6] text-[#0D1B2A]">
      <h2 className="font-serif text-5xl mb-4 text-center">{slide.title}</h2>
      <p className="text-[#4A1942] font-bold tracking-widest uppercase text-xs mb-16">{slide.subtitle}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl">
        {slide.body.map((text, i) => {
          const [title, desc] = text.split(': ');
          return (
            <div key={i} className="relative">
              <div className="text-8xl font-serif opacity-5 absolute -top-12 -left-4 pointer-events-none">{i + 1}</div>
              <h3 className="text-2xl font-serif mb-4 text-[#4A1942]">{title}</h3>
              <p className="opacity-70 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProofSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-white/10">
        <h2 className="font-serif text-3xl text-[#F7E7CE]">{slide.title}</h2>
      </div>
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="flex-1 p-8 bg-[#4A1942]/20 border-r border-white/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#E8B4CB] mb-4">The Prompt</div>
          <div className="p-6 rounded-xl bg-black/40 font-mono text-sm opacity-80 leading-relaxed">
            {slide.body[0]}
          </div>
        </div>
        <div className="flex-1 p-8 bg-[#F7E7CE]/5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#F7E7CE] mb-4">The Output</div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-sm leading-relaxed">
            {slide.body[1]}
          </div>
        </div>
      </div>
      <div className="p-6 bg-black/40 flex justify-between items-center px-12">
        <p className="text-sm opacity-60 italic">{slide.body[2]}</p>
        <p className="font-serif text-xl text-[#E8B4CB]">{slide.body[3]}</p>
      </div>
    </div>
  );
}

function PersonaSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col p-12">
      <h2 className="font-serif text-4xl mb-12 text-center text-[#F7E7CE]">{slide.title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
        {slide.body.map((text, i) => {
          const [title, desc] = text.split(': ');
          return (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 hover:border-[#E8B4CB]/30 transition-all">
              <Users className="text-[#E8B4CB]" size={24} />
              <h3 className="font-serif text-xl">{title}</h3>
              <p className="text-xs opacity-60 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RevenueSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col p-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://picsum.photos/seed/luxury/1920/1080')] bg-cover grayscale" />
      </div>
      <h2 className="font-serif text-5xl mb-16 relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#F7E7CE] to-[#E8B4CB]">
        {slide.title}
      </h2>
      <div className="space-y-6 relative z-10">
        {slide.body.map((text, i) => {
          const [title, desc] = text.split(': ');
          return (
            <div key={i} className="flex items-center gap-8 group">
              <div className="text-4xl font-serif text-[#E8B4CB] opacity-40 group-hover:opacity-100 transition-opacity">0{i + 1}</div>
              <div>
                <h3 className="text-2xl font-serif text-[#F7E7CE]">{title}</h3>
                <p className="opacity-60">{desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ValueSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col p-12 items-center justify-center">
      <h2 className="font-serif text-4xl mb-2 text-[#F7E7CE]">{slide.title}</h2>
      <p className="opacity-60 mb-12">{slide.subtitle}</p>
      
      <div className="w-full max-w-3xl space-y-4 mb-12">
        {slide.body.slice(0, 4).map((text, i) => (
          <div key={i} className="flex justify-between items-center p-4 border-b border-white/5 opacity-50">
            <span>{text.split(': ')[0]}</span>
            <span className="font-mono">{text.split(': ')[1]}</span>
          </div>
        ))}
        <div className="flex justify-between items-center p-6 bg-red-500/10 rounded-xl text-red-400 mt-8">
          <span className="font-bold uppercase tracking-widest text-sm">Total Traditional Cost</span>
          <span className="text-2xl font-serif">$35,000 – $114,000</span>
        </div>
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="text-center"
      >
        <p className="text-xs uppercase tracking-[0.4em] text-[#E8B4CB] mb-2">Your Investment</p>
        <div className="text-9xl font-serif text-[#E8B4CB] drop-shadow-[0_0_30px_rgba(232,180,203,0.3)]">
          $47
        </div>
        <p className="mt-4 opacity-40 text-sm italic">That's $0.30 per expert-level prompt.</p>
      </motion.div>
    </div>
  );
}

function FeaturesSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col p-12 bg-[#F8F4E6] text-[#0D1B2A]">
      <div className="mb-12 text-center">
        <h2 className="font-serif text-4xl mb-2">{slide.title}</h2>
        <p className="text-[#4A1942] font-bold tracking-widest uppercase text-xs">{slide.subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-6 flex-1">
        {slide.body.map((text, i) => (
          <div key={i} className="p-6 rounded-2xl border border-[#4A1942]/10 flex flex-col items-center text-center gap-3 hover:bg-white transition-all">
            <div className="w-10 h-10 rounded-full bg-[#4A1942]/5 flex items-center justify-center text-[#4A1942]">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm font-medium leading-tight">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col p-16">
      <h2 className="font-serif text-4xl mb-16 text-[#F7E7CE]">{slide.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
        {slide.body.map((text, i) => (
          <div key={i} className="flex items-center gap-4">
            <ShieldCheck className="text-[#E8B4CB] shrink-0" size={24} />
            <p className="text-xl opacity-80">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto p-8 rounded-3xl border border-dashed border-white/10 flex items-center justify-center text-white/20 italic">
        [ Placeholder for Future Testimonials ]
      </div>
    </div>
  );
}

function FAQSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col p-12">
      <h2 className="font-serif text-4xl mb-12 text-center text-[#F7E7CE]">{slide.title}</h2>
      <div className="space-y-4 flex-1">
        {slide.body.map((text, i) => {
          const [q, a] = text.split('? ');
          return (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex gap-4">
                <HelpCircle className="text-[#E8B4CB] shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-[#F7E7CE] mb-1">{q}?</h3>
                  <p className="text-sm opacity-60">{a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PricingSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-10 text-[#0D1B2A] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B4CB]/20 rounded-bl-full" />
        
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl mb-2">{slide.title}</h2>
          <p className="text-xs font-bold text-[#4A1942] uppercase tracking-widest">{slide.subtitle}</p>
        </div>

        <div className="space-y-3 mb-10">
          {slide.body.slice(0, 5).map((text, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={16} className="text-[#4A1942]" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="text-sm opacity-40 line-through mb-1">{slide.body[5]}</div>
          <div className="text-5xl font-serif text-[#4A1942]">{slide.body[6].split(': ')[1]}</div>
          <p className="text-[10px] uppercase tracking-widest mt-2 opacity-60">One-Time Payment • Lifetime Access</p>
        </div>

        <button className="w-full py-5 rounded-2xl bg-[#4A1942] text-white font-bold text-lg shadow-xl shadow-[#4A1942]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
          GET INSTANT ACCESS NOW
          <ArrowRight size={20} />
        </button>
        
        <p className="text-center mt-6 text-[10px] opacity-40">Instant download • Start building in 60 seconds</p>
      </div>
    </div>
  );
}

function UrgencySlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-16 text-center">
      <h2 className="font-serif text-5xl mb-12 text-[#E8B4CB] leading-tight max-w-4xl">
        {slide.title}
      </h2>
      <div className="space-y-8 mb-16">
        {slide.body.slice(0, 2).map((text, i) => (
          <p key={i} className="text-2xl opacity-80 font-light italic">"{text}"</p>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="text-sm font-bold tracking-[0.5em] uppercase text-[#F7E7CE] opacity-60">
          {slide.body[2]}
        </div>
        <div className="text-6xl font-serif text-[#E8B4CB]">
          {slide.body[3]}
        </div>
      </div>
    </div>
  );
}

function ClosingSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-16 text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E8B4CB] to-[#F7E7CE] mb-12 flex items-center justify-center shadow-2xl shadow-[#E8B4CB]/20">
        <ShoppingBag size={40} className="text-[#4A1942]" />
      </div>
      <h2 className="font-serif text-6xl mb-4 text-[#F7E7CE]">{slide.title}</h2>
      <p className="text-2xl font-light opacity-60 mb-16 italic">{slide.subtitle}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mb-16">
        {slide.body.slice(0, 3).map((text, i) => (
          <div key={i} className="p-4 border border-white/10 rounded-xl bg-white/5">
            <p className="text-sm font-bold tracking-widest uppercase text-[#E8B4CB]">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-8 text-sm opacity-50 font-mono">
        <p>{slide.body[3]}</p>
        <p>{slide.body[4]}</p>
      </div>
    </div>
  );
}

function DefaultSlide({ slide }: { slide: SlideContent }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <h2 className="text-4xl font-serif mb-8">{slide.title}</h2>
      <div className="space-y-4">
        {slide.body.map((text, i) => (
          <p key={i} className="text-xl opacity-80">{text}</p>
        ))}
      </div>
    </div>
  );
}
