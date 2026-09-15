import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import EFDModule from "./pages/EFDModule";
import ECFModule from "./pages/ECFModule";
import ESocialModule from "./pages/ESocialModule";
import ReformaTributariaModule from "./pages/ReformaTributariaModule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route
                  path="/efd"
                  element={
                    <ProtectedRoute>
                      <EFDModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ecf"
                  element={
                    <ProtectedRoute>
                      <ECFModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/esocial"
                  element={
                    <ProtectedRoute>
                      <ESocialModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reforma-tributaria"
                  element={
                    <ProtectedRoute>
                      <ReformaTributariaModule />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
