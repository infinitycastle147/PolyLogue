import React, { useState } from 'react';
import { Persona } from '../types';
import { MAX_PERSONAS_PER_GROUP, MIN_PERSONAS_PER_GROUP } from '../constants';
import { ArrowLeft, Check, Users, PlusCircle } from 'lucide-react';

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
       
       // Auto-generate name if empty
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
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b sticky top-0 z-10 flex items-center gap-4 shrink-0 shadow-sm">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">New Conversation</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {/* Step 1: Name */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Philosophy of Time (Auto-generated if empty)"
              className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </section>

          {/* Step 2: Select Personas */}
          <section>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
               <label className="block text-sm font-medium text-gray-700">
                 Select Participants ({selectedIds.length}/{MAX_PERSONAS_PER_GROUP})
               </label>
               <div className="flex items-center gap-2">
                 <button 
                    onClick={onCreatePersona}
                    className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors border border-indigo-200"
                 >
                    <PlusCircle size={14} /> Create Custom Persona
                 </button>
                 <div className="flex bg-gray-200 rounded-lg p-1">
                    {['ALL', 'FAMOUS', 'EXPERT', 'ANIME', 'CUSTOM'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-xs font-medium px-3 py-1 rounded-md transition-all ${
                          categoryFilter === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
               </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {filteredPersonas.length === 0 && (
                 <div className="col-span-full text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                    <p>No personas found in this category.</p>
                 </div>
               )}
               {filteredPersonas.map(persona => {
                 const isSelected = selectedIds.includes(persona.id);
                 return (
                   <div 
                     key={persona.id}
                     onClick={() => togglePersona(persona.id)}
                     className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 hover:shadow-md ${
                       isSelected 
                         ? 'border-indigo-600 bg-indigo-50' 
                         : 'border-white bg-white hover:border-indigo-100'
                     }`}
                   >
                      <img src={persona.avatarUrl} alt={persona.name} className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{persona.name}</h4>
                        <p className="text-xs text-indigo-600 font-medium mb-1">{persona.expertise}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{persona.communicationStyle}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-indigo-600">
                          <Check size={20} />
                        </div>
                      )}
                   </div>
                 );
               })}
             </div>
          </section>
        </div>
      </div>

      {/* Sticky Footer Action Button */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20 flex justify-end shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl w-full mx-auto flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!isReady}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold shadow-md transition-all ${
              isReady
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Users size={20} />
            Create Group {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;