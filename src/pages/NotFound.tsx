import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { NaWellMark } from "@/components/ecf/NaWellBrand";
import { A11yReadPageButton } from "@/components/a11y/A11yReadPageButton";
import { usePageSummary } from "@/contexts/AccessibilityContext";

const NotFound = () => {
  const location = useLocation();
  usePageSummary('Página não encontrada, erro 404. Use o link Voltar ao início para ir à tela de acesso.');

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar font-manrope">
      <A11yReadPageButton variant="floating" />
      <div className="text-center p-8">
        <NaWellMark className="h-16 w-16 text-primary mx-auto mb-6 opacity-80" />
        <h1 className="mb-4 text-6xl font-extrabold text-white">404</h1>
        <p className="mb-6 text-lg text-white/70">Página não encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;