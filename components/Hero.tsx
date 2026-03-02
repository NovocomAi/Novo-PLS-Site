import React from 'react';
import { Language, translations } from '../translations.ts';

interface HeroProps {
  lang: Language;
}

const Hero: React.FC<HeroProps> = ({ lang }) => {
  const t = translations[lang].hero;
  return (
    <div className="relative h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2000"
          className="w-full h-full object-cover"
          alt="London Legal Quarter"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent"></div>
      </div>

      <div
        className={`relative z-10 max-w-7xl mx-auto px-6 w-full ${
          lang === 'pt' ? 'pt-[530px] lg:pt-[230px]' : 'pt-[335px] lg:pt-[140px]'
        }`}
      >
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">
              {t.tag}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            {t.title} <br />
            <span className="text-amber-500">{t.subtitle}</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">{t.desc}</p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#services"
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-center transition-all shadow-xl hover:shadow-amber-500/40"
            >
              {t.explore}
            </a>
            <a
              href="#contact"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-full font-bold text-center backdrop-blur-md transition-all"
            >
              {t.schedule}
            </a>
          </div>

          <div className="mt-[7px] grid grid-cols-3 gap-8 border-t border-white/10 pt-10">
            <div>
              <div className="text-3xl font-bold text-white">3+</div>
              <div className="text-sm text-slate-400 font-medium">{t.partners}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">25+</div>
              <div className="text-sm text-slate-400 font-medium">{t.exp}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm text-slate-400 font-medium">{t.compliance}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f8f6f0] to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Hero;
