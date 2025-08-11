import React from 'react';
import SearchIcon from './icons/SearchIcon';

interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
        aria-label="Buscar productos"
      />
    </div>
  );
};

export default ProductSearch;