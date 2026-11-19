import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/index.js';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState('en');

  const setLang = (nextLang) => {
    const normalized = nextLang === 'hi' ? 'hi' : 'en';
    setLangState(normalized);
    i18n.changeLanguage(normalized);
    document.documentElement.lang = normalized;
  };

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, options) => i18n.t(key, options);

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    return next;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
