"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'en' | 'kh' | 'zh';

const LanguageContext = createContext<{ 
  lang: Lang; 
  setLang: (l: Lang) => void;
  multiLangEnabled: boolean;
  setMultiLangEnabled: (val: boolean) => void;
}>({ 
  lang: 'en', 
  setLang: () => {},
  multiLangEnabled: false,
  setMultiLangEnabled: () => {}
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>('en');
  const [multiLangEnabled, setMultiLangEnabled] = useState(false);

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
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, multiLangEnabled, setMultiLangEnabled }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);