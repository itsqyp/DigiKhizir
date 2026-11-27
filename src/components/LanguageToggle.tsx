import { Languages } from "lucide-react";
import { useLanguage } from "../context/useLanguage";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={language === "en" ? "Switch to Bangla" : "Switch to English"}
      className="flex items-center gap-2 rounded-full border border-white/30 bg-deep-sea-blue/70 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-deep-sea-blue"
    >
      <Languages size={18} />
      {language === "en" ? "বাংলা" : "English"}
    </button>
  );
}
