import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import SOSForm from "../../components/emergency/SOSForm";

export default function SOSPage() {
  return (
    <main className="min-h-screen bg-mint-cream px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-deep-sea-blue transition hover:text-amethyst"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cotton-candy/30 text-night-bordeaux">
            <ShieldAlert size={30} />
          </div>

          <h1 className="font-poppins text-3xl font-bold text-deep-sea-blue sm:text-4xl">
            Need emergency help?
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-deep-sea-blue/70 sm:text-base">
            Send your location and emergency details to the response team. Every
            second matters.
          </p>
        </div>

        <SOSForm />

        <p className="mt-6 text-center text-xs leading-relaxed text-deep-sea-blue/50">
          DigiKhizir — Know the danger. Find safety. Get help.
        </p>
      </div>
    </main>
  );
}
