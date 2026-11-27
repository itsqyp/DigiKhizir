import { useState, type ReactNode } from "react";
import { LanguageContext, type Language } from "./LanguageContext";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("digikhizir_language");
    return saved === "bn" ? "bn" : "en";
  });

  function setLanguage(value: Language) {
    setLanguageState(value);
    localStorage.setItem("digikhizir_language", value);
  }

  function toggleLanguage() {
    setLanguage(language === "en" ? "bn" : "en");
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      <div className={language === "bn" ? "language-bn" : "language-en"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}
