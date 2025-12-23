
import React, { useMemo } from 'react';
import { Conversation, Persona } from '../types';
import { MessageSquare, Plus, Search, ChevronRight, Zap } from 'lucide-react';
import Avatar from './Avatar';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  personas: Persona[];
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, activeId, onSelect, onCreateNew, personas }) => {
  // Optimization: Pre-calculate persona map to avoid O(N) filter inside O(M) conversation list
  const personaLookup = useMemo(() => {
    const map = new Map<string, Persona>();
    personas.forEach(p => map.set(p.id, p));
    return map;
  }, [personas]);

  return (
    <div className="flex flex-col h-full bg-[#020617] w-full md:w-80 lg:w-96">
      <div className="px-8 py-8 flex items-center justify-between">
        <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap size={20} fill="white" className="text-white" />
            </div>
            NEXUS AI
        </h1>
      </div>

      <div className="px-6 mb-4">
        <button 
          onClick={onCreateNew}
          className="w-full bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 hover:border-indigo-500 py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all duration-300 group"
        >
          <Plus size={20} className="text-indigo-500 group-hover:text-white" />
          New Neural Swarm
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search swarms..." 
            className="w-full bg-[#0b0f19] text-slate-200 placeholder-slate-600 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 custom-scrollbar">
        {conversations.map(conv => {
            const isActive = activeId === conv.id;
            const participants = conv.personaIds.map(id => personaLookup.get(id)).filter(Boolean) as Persona[];
            const lastMsg = conv.messages[conv.messages.length - 1];
            
            return (
              <button 
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-5 rounded-3xl cursor-pointer transition-all duration-300 relative border ${
                  isActive 
                    ? 'bg-slate-900 border-indigo-500/30 shadow-2xl shadow-black/20 translate-x-1' 
                    : 'bg-transparent border-transparent hover:bg-slate-900/40 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {conv.name}
                  </h3>
                  {lastMsg && (
                    <span className="text-[9px] text-slate-600 font-mono">
                       {new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] truncate mb-4 text-slate-500 font-medium">
                   {lastMsg ? lastMsg.text : 'Pending initialization...'}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                    {participants.slice(0, 5).map(p => (
                        <Avatar key={p.id} src={p.avatarUrl} name={p.name} color={p.color} className="w-6 h-6 ring-2 ring-[#020617]" />
                    ))}
                    </div>
                    {isActive && <ChevronRight size={14} className="text-indigo-500" />}
                </div>
              </button>
            );
          })
        }
      </div>
      
      <div className="p-6 text-[10px] text-slate-600 font-mono tracking-tighter uppercase border-t border-slate-900">
        Nexus Swarm v3.1-F • Flash Native
      </div>
    </div>
  );
};

export default Sidebar;
