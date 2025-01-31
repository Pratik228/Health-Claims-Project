import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import Dashboard from "./pages/Dashboard";
import Research from "./pages/Research";
import InfluencerProfile from "./pages/InfluencerProfile";
import "./index.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar />

        <main className="container mx-auto px-4 py-8 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/research" element={<Research />} />

            <Route path="/influencer/:id" element={<InfluencerProfile />} />

            <Route
              path="*"
              element={
                <div className="text-center py-20">
                  <h2 className="text-2xl text-white mb-4">Page Not Found</h2>
                  <p className="text-gray-400">
                    The page you are looking for does not exist or has been
                    moved.
                  </p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
