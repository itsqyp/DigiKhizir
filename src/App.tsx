import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ResidentHomePage from "./pages/resident/ResidentHomePage";
import SOSPage from "./pages/resident/SOSPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/resident" element={<ResidentHomePage />} />
        <Route path="/sos" element={<SOSPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
