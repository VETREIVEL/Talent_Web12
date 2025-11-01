import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Jobs from "./pages/Jobs";
import Candidates from "./pages/Candidates";
import CandidateProfile from "./components/candidates/CandidateProfile";
import Assessments from "./pages/Assessments";
import NotFound from "./pages/NotFound";
import { worker } from "./mocks/browser";
import { seedDatabase } from "./lib/seed";

const queryClient = new QueryClient();

// Initialize MSW and seed data
if (import.meta.env.DEV) {
  worker.start({
    onUnhandledRequest: 'bypass',
  });
  seedDatabase();
}

const App = () => {
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />
            <Route path="/assessments" element={<Assessments />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
