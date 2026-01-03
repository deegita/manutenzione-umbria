import React, { useState, useRef } from 'react';
import { Coordinates, MaintenancePOI, PriorityLevel } from '../types';
import { analyzeMaintenanceImage } from '../services/geminiService';
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from '../constants';

interface CreatePOIModalProps {
  location: Coordinates;
  address: string;
  availableCategories: string[];
  onClose: () => void;
  onSave: (poiData: Partial<MaintenancePOI>, newCategory?: string) => void;
}

// Helper to resize image to avoid huge payloads
const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Compress to jpeg 0.6 quality
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => {
      resolve(base64Str); // Fallback
    };
  });
};

export const CreatePOIModal: React.FC<CreatePOIModalProps> = ({
  location,
  address,
  availableCategories,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(availableCategories[0]);
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [newCategory, setNewCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        // Resize immediately
        const resizedBase64 = await resizeImage(rawBase64);
        
        setImage(resizedBase64);
        setAnalyzing(true);
        
        // Analyze with Gemini
        const analysis = await analyzeMaintenanceImage(resizedBase64);
        setAnalyzing(false);

        if (analysis) {
          if (analysis.suggestedTitle) setTitle(analysis.suggestedTitle);
          if (analysis.suggestedDescription) setDescription(analysis.suggestedDescription);
          if (analysis.suggestedCategory && availableCategories.includes(analysis.suggestedCategory)) {
            setCategory(analysis.suggestedCategory);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const finalCategory = isCustomCategory ? newCategory : category;
    if (!title || !finalCategory) return;

    onSave({
      title,
      description,
      category: finalCategory,
      priority,
      images: image ? [image] : [],
      location,
      address
    }, isCustomCategory ? newCategory : undefined);
  };

  const getIconSvg = (catName: string) => {
    const conf = CATEGORY_CONFIG[catName] || CATEGORY_CONFIG['default'];
    return conf.icon;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-all duration-300" onClick={onClose} />

      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[92vh] relative z-10 overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white/80 backdrop-blur flex justify-between items-center sticky top-0 z-20 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Nuova Segnalazione</h2>
            <p className="text-xs text-slate-400 font-medium">Compila i dettagli della richiesta</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto overflow-x-hidden scrollbar-hide space-y-6">
          
          {/* Address Display (Auto-Geocoded) */}
          <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
             <div className="mt-1 text-indigo-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
             <div>
               <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Posizione rilevata</p>
               <p className="text-sm font-semibold text-slate-700 leading-tight mt-0.5">{address || 'Recupero indirizzo in corso...'}</p>
             </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-3">
             <label className={`relative group w-full aspect-video rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 block shadow-sm
                ${image ? 'ring-0' : 'bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
                
                {image ? (
                   <>
                     <img src={image} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <div className="text-white flex flex-col items-center gap-2">
                           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           <span className="font-bold text-sm">Cambia Foto</span>
                        </div>
                     </div>
                   </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <p className="font-semibold text-sm">Aggiungi una foto</p>
                    </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            
            {analyzing && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50/50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-100/50 animate-fadeIn">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="animate-pulse">Analisi intelligente in corso...</span>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Titolo</label>
            <input 
              type="text" 
              className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none border font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Buca pericolosa"
            />
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Priorità</label>
            <div className="flex gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as PriorityLevel[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                    priority === p 
                      ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} ${PRIORITY_CONFIG[p].border} ring-1 ring-offset-1` 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Grid Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Categoria</label>
            
            {!isCustomCategory ? (
              <div className="grid grid-cols-2 gap-3">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group text-left
                      ${category === cat 
                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${category === cat ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:text-indigo-500'}`}>
                       <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={getIconSvg(cat)}/></svg>
                    </div>
                    <span className={`text-sm font-semibold ${category === cat ? 'text-indigo-900' : 'text-slate-600'}`}>{cat}</span>
                  </button>
                ))}
                <button 
                  onClick={() => setIsCustomCategory(true)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Altro
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 rounded-xl border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none border"
                  placeholder="Scrivi categoria..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  autoFocus
                />
                <button 
                  onClick={() => setIsCustomCategory(false)}
                  className="px-4 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Annulla
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Note</label>
            <textarea 
              className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none border resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dettagli..."
            />
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 pt-4 bg-white sticky bottom-0 z-20 border-t border-slate-100">
          <button 
            onClick={handleSave}
            disabled={analyzing || !title}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
              ${analyzing || !title 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            {analyzing ? 'Analisi...' : 'Invia Segnalazione'}
            {!analyzing && <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
};