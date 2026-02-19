"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from "@/constants/translations";

type Lang = 'en' | 'kh' | 'zh';

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ 
  lang: 'en', setLang: () => {} 
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    // Load saved language from local storage on start
    const saved = localStorage.getItem('app_lang') as Lang;
    if (saved) setLang(saved);
  }, []);

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('app_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);