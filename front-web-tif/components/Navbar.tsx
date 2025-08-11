import React from 'react';
import { ViewMode } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import DashboardIcon from './icons/DashboardIcon';
import ProductSearch from './ProductSearch'; 

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void; // This will now also handle clearing search
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, searchTerm, onSearchChange }) => {
  const navButtonClasses = "flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400";
  const activeClasses = "bg-sky-600 text-white shadow-md hover:bg-sky-700";
  const inactiveClasses = "text-slate-600 hover:bg-sky-100 hover:text-sky-700";

  const handleTitleClick = () => {
    onNavigate(ViewMode.DASHBOARD); // onNavigate now clears search and sets view
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button 
            onClick={handleTitleClick} 
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-lg p-1 -ml-1"
            aria-label="Go to dashboard and clear search"
          >
            <h1 className="text-2xl font-bold text-sky-700">Venci<span className="text-sky-500">Scan</span></h1>
          </button>
          
          <nav className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => onNavigate(ViewMode.DASHBOARD)}
              className={`${navButtonClasses} ${currentView === ViewMode.DASHBOARD && !searchTerm ? activeClasses : inactiveClasses}`}
              aria-label="Vista de Panel"
            >
              <DashboardIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Panel</span>
            </button>
            <button
              onClick={() => onNavigate(ViewMode.CALENDAR)}
              className={`${navButtonClasses} ${currentView === ViewMode.CALENDAR && !searchTerm ? activeClasses : inactiveClasses}`}
              aria-label="Vista de Calendario"
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          </nav>

          <div className="flex-1 max-w-xs ml-4">
             <ProductSearch searchTerm={searchTerm} onSearchChange={onSearchChange} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
