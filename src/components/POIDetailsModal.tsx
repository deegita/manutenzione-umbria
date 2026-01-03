import React from 'react';
import { MaintenancePOI, Role } from '../types';
import { PRIORITY_CONFIG } from '../constants';

interface POIDetailsModalProps {
  poi: MaintenancePOI;
  userRole: Role;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'COMPLETED') => void;
  onAddImage: (id: string, base64: string) => void;
}

export const POIDetailsModal: React.FC<POIDetailsModalProps> = ({
  poi,
  userRole,
  onClose,
  onUpdateStatus,
  onAddImage
}) => {
  
  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.location.lat},${poi.location.lng}`;
    window.open(url, '_blank');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onAddImage(poi.id, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const hasHeroImage = poi.images.length > 0;
  const priorityConfig = PRIORITY_CONFIG[poi.priority || 'MEDIUM'];

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] relative z-10 overflow-hidden animate-slideUp">
        
        {/* Hero Image or Colored Header */}
        <div className={`relative ${hasHeroImage ? 'h-56' : 'h-24 bg-slate-100'} shrink-0`}>
          {hasHeroImage ? (
            <>
              <img src={poi.images[0]} alt="Main" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            </>
          ) : (
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
             </div>
          )}
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-colors z-20
              ${hasHeroImage ? 'bg-black/20 text-white hover:bg-black/40' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          {/* Badges Container */}
          <div className="absolute top-4 left-4 flex gap-2 z-20">
             <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border border-white/20
               ${poi.status === 'COMPLETED' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
               {poi.status === 'COMPLETED' ? 'COMPLETATO' : 'IN ATTESA'}
             </span>
             {/* Priority Badge on Image */}
             <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border border-white/20 bg-white/90 ${priorityConfig.color}`}>
               Priorità {priorityConfig.label}
             </span>
          </div>

          {/* Title on Image */}
          {hasHeroImage && (
            <div className="absolute bottom-4 left-6 right-6">
              <h2 className="text-2xl font-bold text-white drop-shadow-md leading-tight">{poi.title}</h2>
              <p className="text-white/90 text-sm font-medium mt-1 flex items-center gap-1">
                 {poi.category}
              </p>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-white">
          
          {!hasHeroImage && (
            <div className="mb-2">
               <h2 className="text-2xl font-bold text-slate-800 leading-tight">{poi.title}</h2>
               <div className="flex items-center gap-2 mt-2">
                 <span className="text-indigo-600 font-bold text-sm bg-indigo-50 px-2 py-1 rounded-md">{poi.category}</span>
                 <span className={`text-xs font-bold px-2 py-1 rounded-md border ${priorityConfig.color} ${priorityConfig.bg} ${priorityConfig.border}`}>
                    Priorità {priorityConfig.label}
                 </span>
               </div>
            </div>
          )}

          {/* Address Row */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 bg-slate-100 p-2 rounded-full text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indirizzo</p>
              <p className="text-slate-800 font-medium text-base">{poi.address || 'Coordinate GPS (Indirizzo non disp.)'}</p>
            </div>
          </div>

          <div className="space-y-4">
             {/* Description */}
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrizione</p>
               <p className="text-slate-700 leading-relaxed">{poi.description || 'Nessuna descrizione fornita.'}</p>
             </div>

             {/* Metadata */}
             <div className="flex items-center justify-between text-sm text-slate-500 px-1 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span>Segnalato da <strong>{poi.createdBy}</strong></span>
                </div>
                <div>{new Date(poi.createdAt).toLocaleDateString()}</div>
             </div>

             {/* Thumbnail Gallery */}
             {poi.images.length > 1 && (
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Altre foto</p>
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                   {poi.images.slice(1).map((img, idx) => (
                     <img key={idx} src={img} alt="Extra" className="h-20 w-20 object-cover rounded-xl shadow-sm border border-slate-100 shrink-0" />
                   ))}
                 </div>
               </div>
             )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
             <button 
              onClick={handleNavigate}
              className="col-span-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 px-4 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Apri in Maps
            </button>
            
            <label className="col-span-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            {userRole === Role.OPERATORE && poi.status !== 'COMPLETED' && (
               <button 
               onClick={() => onUpdateStatus(poi.id, 'COMPLETED')}
               className="col-span-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 px-4 rounded-xl font-bold shadow-emerald-200 shadow-md flex items-center justify-center gap-2 transition-colors"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               Fatto
             </button>
            )}
            {/* Padding if needed */}
            {userRole !== Role.OPERATORE && (
               <div className="hidden sm:block"></div> 
            )}
          </div>
        </div>
      </div>
    </div>
  );
};