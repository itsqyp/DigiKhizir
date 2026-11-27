import { Link } from "react-router-dom";

import backgroundImage from "../assets/backgroundHomePageDesktop.png";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../context/useLanguage";
import { homeTranslations } from "../translations/home";

export default function HomePage() {
  const { language } = useLanguage();
  const t = homeTranslations[language];

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-deep-sea-blue bg-cover bg-center bg-no-repeat px-4 ${
        language === "bn" ? "language-bn" : "language-en"
      }`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-deep-sea-blue/50" />

      {/* Language toggle */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageToggle />
      </div>

      {/* Homepage content */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-white/20 bg-deep-sea-blue/70 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-12">
        <h1 className="font-poppins text-4xl font-bold text-cotton-candy sm:text-5xl">
          DigiKhizir
        </h1>

        <p className="mt-4 text-base leading-relaxed text-mint-cream sm:text-lg">
          {t.tagline}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-mint-cream/80">
          {t.description}
        </p>

        <Link
          to="/resident"
          className="mt-8 inline-block rounded-xl bg-amethyst px-8 py-4 font-semibold text-white shadow-lg transition hover:scale-105 hover:brightness-110"
        >
          {t.getStarted}
        </Link>
      </div>
    </main>
  );
}
