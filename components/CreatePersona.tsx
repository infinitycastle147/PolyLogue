
import React, { useState } from 'react';
import { Persona } from '../types';
import { ArrowLeft, RefreshCw, Save, Sparkles, Cpu, Palette, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';

interface CreatePersonaProps {
  onSave: (persona: Persona) => void;
  onCancel: () => void;
}

const TRAIT_OPTIONS = [
  'optimistic', 'skeptical', 'analytical', 'creative', 'pragmatic', 
  'idealistic', 'curious', 'direct', 'empathetic', 'witty', 
  'formal', 'casual', 'philosophical', 'data-driven'
];

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 
  'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

const CreatePersona: React.FC<CreatePersonaProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [expertise, setExpertise] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(Date.now().toString());
  
  const toggleTrait = (trait: string) => {
    if (traits.includes(trait)) {
      setTraits(traits.filter(t => t !== trait));
    } else if (traits.length < 4) {
      setTraits([...traits, trait]);
    }
  };

  const handleRandomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || avatarSeed}`;

  const handleSubmit = () => {
    if (!name || !expertise || !communicationStyle) return;

    const newPersona: Persona = {
      id: `custom_${Date.now()}`,
      name,
      category: 'CUSTOM',
      expertise,
      traits,
      communicationStyle,
      avatarUrl,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    onSave(newPersona);
  };

  const isFormValid = name.trim() && expertise.trim() && communicationStyle.trim() && traits.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#020617] relative">
      {/* Header */}
      <div className="bg-[#0f172a]/80 backdrop-blur-xl px-6 py-4 border-b border-slate-800 sticky top-0 z-20 flex items-center gap-4 shrink-0 shadow-xl shadow-black/20">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
          <ArrowLeft size={22} />
        </button>
        <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Persona Forge</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Synthesize Custom Entity</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 pb-32 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-12">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-1 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl">
                <Avatar 
                    src={avatarUrl} 
                    name={name || 'New Persona'} 
                    color="bg-indigo-600" 
                    className="relative w-40 h-40 border-4 border-[#020617] shadow-inner"
                />
              </div>
              <button 
                onClick={handleRandomizeAvatar}
                className="absolute bottom-2 right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all z-10 border border-white/10"
                title="Re-Synthesize Avatar"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Visual Identifier</p>
          </div>

          <div className="space-y-10">
            {/* Identity Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Sparkles size={12} className="text-indigo-400" /> Identifier
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Cyber-Philosopher"
                        className="w-full px-5 py-3.5 text-white placeholder-slate-700 bg-[#0b0f19] border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                </div>

                {/* Expertise */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Cpu size={12} className="text-indigo-400" /> Core Module
                    </label>
                    <input
                        type="text"
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        placeholder="Systems Architecture"
                        className="w-full px-5 py-3.5 text-white placeholder-slate-700 bg-[#0b0f19] border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                </div>
            </div>

            {/* Traits */}
            <div className="space-y-4">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={12} className="text-indigo-400" /> Personality Traits
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">{traits.length}/4 ACTIVE</span>
              </div>
              <div className="flex flex-wrap gap-2.5 bg-[#0b0f19] p-5 rounded-3xl border border-slate-800">
                {TRAIT_OPTIONS.map(trait => (
                  <button
                    key={trait}
                    onClick={() => toggleTrait(trait)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                      traits.includes(trait)
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/20 scale-105'
                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>

            {/* Communication Style */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MessageCircle size={12} className="text-indigo-400" /> Linguistics Engine
              </label>
              <textarea
                value={communicationStyle}
                onChange={(e) => setCommunicationStyle(e.target.value)}
                placeholder="Direct, technical, heavy use of data metaphors..."
                rows={3}
                className="w-full px-5 py-4 text-white placeholder-slate-700 bg-[#0b0f19] border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#020617]/90 backdrop-blur-xl border-t border-slate-800 p-6 sticky bottom-0 z-20 flex justify-center shadow-2xl">
        <div className="max-w-2xl w-full flex justify-end">
            <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-95 ${
                isFormValid
                    ? 'bg-white text-black hover:bg-indigo-50 shadow-xl shadow-white/5 hover:-translate-y-1'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }`}
            >
                <Save size={18} />
                <span className="uppercase tracking-widest text-sm">Forge Persona</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePersona;
