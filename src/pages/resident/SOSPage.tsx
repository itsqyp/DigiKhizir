import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import SOSForm from "../../components/emergency/SOSForm";
import LanguageToggle from "../../components/LanguageToggle";

import { useLanguage } from "../../context/useLanguage";
import { sosPageTranslations } from "../../translations/sos";

export default function SOSPage() {
  const { language } = useLanguage();
  const t = sosPageTranslations[language];

  return (
    <main className="min-h-screen bg-mint-cream px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Top navigation */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/resident"
            className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sea-blue transition hover:text-amethyst"
          >
            <ArrowLeft size={18} />
            {t.back}
          </Link>

          <LanguageToggle />
        </div>

        {/* Page heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cotton-candy/30 text-night-bordeaux">
            <ShieldAlert size={30} />
          </div>

          <h1 className="font-poppins text-3xl font-bold text-deep-sea-blue sm:text-4xl">
            {t.heading}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-deep-sea-blue/70 sm:text-base">
            {t.description}
          </p>
        </div>

        {/* SOS form */}
        <SOSForm />

        {/* Footer */}
        <p className="mt-6 text-center text-xs leading-relaxed text-deep-sea-blue/50">
          {t.footer}
        </p>
      </div>
    </main>
  );
}
