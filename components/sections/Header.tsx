import { useState } from "react";
import { Language, languages } from "../../lib/translations";

interface HeaderProps {
  currentLanguage: Language;
  setCurrentLanguage: (language: Language) => void;
  t: (key: string) => string;
}

export default function Header({
  currentLanguage,
  setCurrentLanguage,
  t,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <header className="glass-dark sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent font-display">
              {t("brandName")}
            </h1>
            <span className="ml-3 text-sm text-slate-300 hidden sm:inline font-medium">
              {t("brandSubtitle")}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            <a
              href="#"
              className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
            >
              {t("nav.home")}
            </a>
            <a
              href="#"
              className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
            >
              {t("nav.features")}
            </a>
            <a
              href="#"
              className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
            >
              {t("nav.pricing")}
            </a>
          </nav>

          {/* Language Selector & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as Language)}
                className="appearance-none glass-dark border border-white/20 rounded-lg px-3 py-2 text-sm text-white hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <button className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-4 py-2 rounded-lg">
              {t("nav.login")}
            </button>
            <button className="bg-gradient-primary text-white px-6 py-2.5 rounded-lg hover:shadow-glow transition-all duration-300 font-semibold">
              {t("nav.signup")}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/10 glass-dark">
            <div className="flex flex-col space-y-4">
              <a
                href="#"
                className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
              >
                {t("nav.home")}
              </a>
              <a
                href="#"
                className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
              >
                {t("nav.features")}
              </a>
              <a
                href="#"
                className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
              >
                {t("nav.pricing")}
              </a>
              <div className="flex items-center justify-between pt-4">
                <div className="flex space-x-3">
                  <button className="text-slate-300 hover:text-white transition-all duration-300">
                    {t("nav.login")}
                  </button>
                  <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg hover:shadow-glow transition-all duration-300">
                    {t("nav.signup")}
                  </button>
                </div>
                <select
                  value={currentLanguage}
                  onChange={(e) =>
                    setCurrentLanguage(e.target.value as Language)
                  }
                  className="appearance-none glass-dark border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}