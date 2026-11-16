import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SOSPage from "./pages/resident/SOSPage";

function HomePage() {
  return (
    <main className="min-h-screen bg-mint-cream flex items-center justify-center px-4">
      <div className="bg-deep-sea-blue p-10 rounded-2xl max-w-lg w-full text-center shadow-xl">
        <h1 className="text-4xl font-bold text-cotton-candy">DigiKhizir</h1>

        <p className="text-mint-cream mt-3">
          Know the danger. Find safety. Get help.
        </p>

        <Link
          to="/sos"
          className="inline-block bg-amethyst text-white px-6 py-3 rounded-lg mt-6 font-semibold transition hover:opacity-90"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sos" element={<SOSPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
