import { createContext, useContext, useState, type ReactNode } from "react";

type Language = "en" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

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

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
