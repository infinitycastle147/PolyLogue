
import React, { useState } from 'react';
import { Persona } from '../types';
import { MAX_PERSONAS_PER_GROUP, MIN_PERSONAS_PER_GROUP } from '../constants';
import { ArrowLeft, Check, Users, PlusCircle, Search } from 'lucide-react';
import Avatar from './Avatar';

interface CreateGroupProps {
  personas: Persona[];
  onCreate: (name: string, selectedPersonaIds: string[]) => void;
  onCancel: () => void;
  onCreatePersona: () => void;
}

const CreateGroup: React.FC<CreateGroupProps> = ({ personas, onCreate, onCancel, onCreatePersona }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const togglePersona = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    } else {
      if (selectedIds.length < MAX_PERSONAS_PER_GROUP) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length >= MIN_PERSONAS_PER_GROUP) {
       let finalName = groupName.trim();
       
       if (!finalName) {
         const selectedPersonas = personas.filter(p => selectedIds.includes(p.id));
         const names = selectedPersonas.slice(0, 3).map(p => p.name.split(' ')[0]).join(', ');
         finalName = `${names}${selectedPersonas.length > 3 ? ' & others' : ''}`;
       }
       
       onCreate(finalName, selectedIds);
    }
  };

  const filteredPersonas = categoryFilter === 'ALL' 
    ? personas 
    : personas.filter(p => p.category === categoryFilter);

  const isReady = selectedIds.length >= MIN_PERSONAS_PER_GROUP;

  return (
    <div className="flex flex-col h-full bg-[#020617] relative">
      {/* Header */}
      <div className="bg-[#0f172a]/80 backdrop-blur-xl px-6 py-4 border-b border-slate-800 sticky top-0 z-20 flex items-center gap-4 shrink-0 shadow-xl shadow-black/20">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
          <ArrowLeft size={22} />
        </button>
        <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Swarm Configuration</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Neural Node Selection</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 pb-32 custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full space-y-10">
          {/* Step 1: Name */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="block text-sm font-bold text-slate-300 mb-3 ml-1 uppercase tracking-wider">
              Swarm Designation <span className="text-slate-600 font-normal lowercase">(Optional)</span>
            </label>
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Strategic Deep Dive (Auto-generated if empty)"
                  className="relative w-full px-5 py-4 text-white placeholder-slate-600 bg-[#0b0f19] border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
            </div>
          </section>

          {/* Step 2: Select Personas */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
               <div>
                   <label className="block text-sm font-bold text-slate-300 ml-1 uppercase tracking-wider">
                    Persona Matrix
                   </label>
                   <p className="text-xs text-slate-500 ml-1 mt-1 font-mono">
                    {selectedIds.length}/{MAX_PERSONAS_PER_GROUP} NODES ACTIVE
                   </p>
               </div>
               
               <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                 <button 
                    onClick={onCreatePersona}
                    className="text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2.5 rounded-xl transition-all border border-indigo-500/30 flex items-center gap-2 whitespace-nowrap active:scale-95"
                 >
                    <PlusCircle size={16} /> Forge New Persona
                 </button>
                 <div className="flex bg-[#0b0f19] rounded-xl p-1 border border-slate-800 overflow-x-auto no-scrollbar">
                    {['ALL', 'FAMOUS', 'EXPERT', 'ANIME', 'CUSTOM'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap tracking-wider uppercase ${
                          categoryFilter === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
               </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredPersonas.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600 bg-[#0b0f19]/40 rounded-3xl border border-dashed border-slate-800">
                    <Search className="mb-4 opacity-10" size={48} />
                    <p className="text-sm font-medium">No entities detected in this sector.</p>
                 </div>
               )}
               {filteredPersonas.map(persona => {
                 const isSelected = selectedIds.includes(persona.id);
                 return (
                   <div 
                     key={persona.id}
                     onClick={() => togglePersona(persona.id)}
                     className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-4 group hover:scale-[1.02] active:scale-95 ${
                       isSelected 
                         ? 'border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-900/10' 
                         : 'border-slate-800 bg-[#0b0f19]/60 hover:border-slate-700 hover:bg-[#0b0f19]'
                     }`}
                   >
                      <div className="relative shrink-0">
                         <Avatar 
                            src={persona.avatarUrl} 
                            name={persona.name} 
                            color={persona.color}
                            className={`w-14 h-14 transition-all duration-500 ${isSelected ? 'ring-2 ring-indigo-400 p-0.5' : ''}`} 
                         />
                         {isSelected && (
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full border-2 border-[#020617] shadow-lg">
                                <Check size={12} strokeWidth={3} />
                            </div>
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>{persona.name}</h4>
                        <p className="text-[10px] text-indigo-400 font-bold mb-1 truncate uppercase tracking-tighter">{persona.expertise}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight font-medium">{persona.communicationStyle}</p>
                      </div>
                   </div>
                 );
               })}
             </div>
          </section>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="bg-[#020617]/90 backdrop-blur-xl border-t border-slate-800 p-6 sticky bottom-0 z-20 flex justify-center shadow-2xl shadow-black">
        <div className="max-w-4xl w-full flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!isReady}
            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-95 ${
              isReady
                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 hover:-translate-y-1'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <Users size={20} />
            <span className="uppercase tracking-widest text-sm">Initialize {selectedIds.length} Nodes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
