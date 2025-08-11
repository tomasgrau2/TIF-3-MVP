import React, { useState, useEffect, FormEvent } from 'react';
import { Product } from '../types';
import CloseIcon from './icons/CloseIcon';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => void; // Can be Omit<Product, 'id'> for add, or Product for update
  productToEdit?: Product;
}

const initialFormState = {
  codebar: '',
  name: '',
  description: '',
  manufacturer: '',
  quantity: 0,
  expiryDate: '', // Store as string for input field
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        codebar: productToEdit.codebar || '',
        name: productToEdit.name,
        description: productToEdit.description,
        manufacturer: productToEdit.manufacturer,
        quantity: Number(productToEdit.quantity) || 0,
        expiryDate: productToEdit.expiryDate.toISOString().split('T')[0], // Format Date to YYYY-MM-DD string
      });
    } else {
      setFormData(initialFormState);
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? parseInt(value, 10) : value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.expiryDate) {
        alert("La fecha de vencimiento es requerida.");
        return;
    }
    if (formData.quantity === null || formData.quantity === undefined || isNaN(formData.quantity) || formData.quantity < 0) {
        alert("La cantidad es requerida y debe ser un número no negativo.");
        return;
    }
    const dataToSave = productToEdit ? { ...formData, id: productToEdit.id } : formData;
    onSave(dataToSave);
  };

  if (!isOpen) return null;

  const inputClasses = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 bg-slate-50 placeholder-slate-500 text-slate-700";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[101] transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-sky-700">
            {productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-100"
            aria-label="Close form"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Form Fields: Codebar, Name, Lot Number, Expiry Date (Required) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="codebar" className="block text-sm font-medium text-slate-700 mb-1">Código de Barras <span className="text-red-500">*</span></label>
              <input type="text" name="codebar" id="codebar" value={formData.codebar} onChange={handleChange} required className={inputClasses} placeholder="e.g., 1234567890123"/>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputClasses} placeholder="e.g., Amoxicillin 250mg"/>
            </div>
          </div>
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento <span className="text-red-500">*</span></label>
            <input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleChange} required className={inputClasses}/>
          </div>
          
          {/* Other Form Fields */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={`${inputClasses} min-h-[60px]`} placeholder="e.g., Broad-spectrum antibiotic..."></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-slate-700 mb-1">Laboratorio</label>
              <input type="text" name="manufacturer" id="manufacturer" value={formData.manufacturer} onChange={handleChange} className={inputClasses} placeholder="e.g., PharmaGlobal Inc."/>
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">Cantidad <span className="text-red-500">*</span></label>
              <input type="number" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} min="0" required className={inputClasses} placeholder="e.g., 100"/>
            </div>
          </div>

          <footer className="pt-5 mt-2 border-t border-slate-200 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              {productToEdit ? 'Guardar Cambios' : 'Agregar Producto'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;