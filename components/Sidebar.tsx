import React from 'react';
import { Conversation, Persona } from '../types';
import { MessageSquare, Plus, Search, Settings } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  personas: Persona[];
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, activeId, onSelect, onCreateNew, personas }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-80 lg:w-96">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          PolyLogue
        </h1>
        <button className="p-2 text-gray-400 hover:text-gray-600">
          <Settings size={20} />
        </button>
      </div>

      {/* Action */}
      <div className="p-4">
        <button 
          onClick={onCreateNew}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={20} />
          New Discussion
        </button>
      </div>

      {/* Search (Visual Only for MVP) */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search discussions..." 
            className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 p-4">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">No conversations yet.</p>
            <p className="text-xs mt-1">Create a group to start.</p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = activeId === conv.id;
            const participants = personas.filter(p => conv.personaIds.includes(p.id));
            const lastMsg = conv.messages[conv.messages.length - 1];
            
            return (
              <div 
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`p-3 rounded-xl cursor-pointer transition-colors group ${
                  isActive ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-gray-50 border-transparent'
                } border`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm truncate pr-2 ${isActive ? 'text-indigo-900' : 'text-gray-800'}`}>
                    {conv.name}
                  </h3>
                  {lastMsg && (
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                       {new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 truncate mb-3 h-4">
                   {lastMsg ? (lastMsg.type === 'POLL' ? '📊 Poll active' : lastMsg.text) : 'New conversation'}
                </p>

                <div className="flex -space-x-1.5">
                  {participants.slice(0, 4).map(p => (
                    <img 
                      key={p.id} 
                      src={p.avatarUrl} 
                      alt={p.name}
                      className="w-5 h-5 rounded-full ring-2 ring-white object-cover"
                    />
                  ))}
                  {participants.length > 4 && (
                    <div className="w-5 h-5 rounded-full bg-gray-100 text-[10px] flex items-center justify-center ring-2 ring-white text-gray-500 font-bold">
                      +{participants.length - 4}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-4 text-[10px] text-gray-400 text-center border-t border-gray-100">
        PolyLogue v1.0 • Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default Sidebar;