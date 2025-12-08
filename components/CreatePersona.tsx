import React, { useState } from 'react';
import { Persona } from '../types';
import { ArrowLeft, RefreshCw, Save, User } from 'lucide-react';

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
  
  // Toggle trait selection
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
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b sticky top-0 z-10 flex items-center gap-4 shrink-0 shadow-sm">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Create Custom Persona</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 space-y-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <img 
                src={avatarUrl} 
                alt="Avatar Preview" 
                className="w-32 h-32 rounded-full border-4 border-indigo-50 shadow-md bg-white"
              />
              <button 
                onClick={handleRandomizeAvatar}
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
                title="Randomize Avatar"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400">Avatar updates with name or randomizer</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cyberpunk Philosopher"
                className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area of Expertise</label>
              <input
                type="text"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="e.g., Digital Ethics & AI"
                className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Traits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personality Traits <span className="text-gray-400 font-normal">(Select up to 4)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TRAIT_OPTIONS.map(trait => (
                  <button
                    key={trait}
                    onClick={() => toggleTrait(trait)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      traits.includes(trait)
                        ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>

            {/* Communication Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Communication Style</label>
              <textarea
                value={communicationStyle}
                onChange={(e) => setCommunicationStyle(e.target.value)}
                placeholder="e.g., Speaks in metaphors, uses technical jargon, very concise..."
                rows={3}
                className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20 flex justify-end shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
         <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold shadow-md transition-all ${
              isFormValid
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save size={18} />
            Save Persona
          </button>
      </div>
    </div>
  );
};

export default CreatePersona;