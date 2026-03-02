import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LOGO_COMPONENT } from '../constants.tsx';
import { Language, translations } from '../translations.ts';

interface HeaderProps {
  onAdminClick: () => void;
  lang: Language;
  setLang: (l: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminClick, lang, setLang }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const adminTimerRef = useRef<number | null>(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [pin, setPin] = useState('');
  const PASSCODE = '0412';
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hideCta = pathname.startsWith('/admin') || pathname.startsWith('/client');
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdminStart = () => {
    adminTimerRef.current = window.setTimeout(() => {
      setShowKeypad(true);
    }, 5000);
  };

  const handleAdminEnd = () => {
    if (adminTimerRef.current) {
      clearTimeout(adminTimerRef.current);
    }
  };

  const navItems = [
    { name: t.nav.home, href: '/#home' },
    { name: t.nav.services, href: '/#services' },
    { name: t.nav.partners, href: '/#partners' },
    { name: t.nav.leadership, href: '/#about' },
    { name: 'Resources', href: '/resources' },
    { name: 'Client Portal', href: '/#client-portal' },
    { name: t.nav.contact, href: '/#contact' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-md py-4">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            onMouseDown={handleAdminStart}
            onMouseUp={handleAdminEnd}
            onMouseLeave={handleAdminEnd}
          >
            {LOGO_COMPONENT('w-12 h-12 shadow-xl cursor-pointer')}
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-xl tracking-tight leading-none text-slate-900`}>
              PLS Consultants
            </span>
            <span className={`text-[10px] uppercase tracking-widest mt-1 text-slate-500`}>
              Professional Excellence
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-medium transition-colors text-slate-700`}
              style={{ color: '#475569' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#c5a059')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wider relative md:static top-[35px] md:top-0 right-[-40px] md:right-0 border-slate-200 text-slate-600 hover:bg-slate-50`}
          >
            <span style={{ color: lang === 'en' ? '#c5a059' : '#64748b' }}>EN</span>
            <div className="w-px h-3 bg-current opacity-30"></div>
            <span style={{ color: lang === 'pt' ? '#c5a059' : '#64748b' }}>PT</span>
          </button>

          <button
            onMouseDown={handleAdminStart}
            onMouseUp={handleAdminEnd}
            onMouseLeave={handleAdminEnd}
            className={`p-2 rounded-full transition-colors text-slate-400 hover:text-slate-600`}
            title="Admin Access (Hold 5s)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </button>

          {!hideCta && (
            <Link
              to="/#client-portal"
              className={`text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
                lang === 'pt' ? 'relative right-[15px]' : ''
              }`}
              style={{
                backgroundColor: '#c5a059',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#a88650')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c5a059')}
            >
              {t.nav.cta}
            </Link>
          )}
        </div>
      </div>

      {showKeypad && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center"
          onClick={() => {
            setShowKeypad(false);
            setPin('');
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 w-[320px] shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">
                Admin Access
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">Enter 4-digit code</div>
              <div className="mt-2 text-xl font-mono tracking-[0.3em]">{pin.padEnd(4, '•')}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  className="py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xl hover:border-amber-300 hover:text-amber-700"
                  onClick={() => {
                    const next = (pin + n.toString()).slice(0, 4);
                    setPin(next);
                    if (next.length === 4) {
                      if (next === PASSCODE) {
                        setShowKeypad(false);
                        setPin('');
                        navigate('/admin/clients');
                      } else {
                        setTimeout(() => setPin(''), 300);
                      }
                    }
                  }}
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                className="py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xl hover:border-amber-300 hover:text-amber-700"
                onClick={() => {
                  const next = (pin + '0').slice(0, 4);
                  setPin(next);
                  if (next.length === 4) {
                    if (next === PASSCODE) {
                      setShowKeypad(false);
                      setPin('');
                      navigate('/admin/clients');
                    } else {
                      setTimeout(() => setPin(''), 300);
                    }
                  }
                }}
              >
                0
              </button>
              <button
                className="py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xl hover:border-amber-300 hover:text-amber-700"
                onClick={() => setPin(pin.slice(0, -1))}
              >
                ⌫
              </button>
            </div>
            <button
              onClick={() => {
                setShowKeypad(false);
                setPin('');
              }}
              className="w-full py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
