
import React, { useState, useEffect } from 'react';
import { AppState, Conversation, ViewState, Message, Persona } from './types';
import { MAX_CONVERSATIONS, PREDEFINED_PERSONAS } from './constants';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CreateGroup from './components/CreateGroup';
import CreatePersona from './components/CreatePersona';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [state, setState] = useState<AppState>({
    conversations: [],
    activeConversationId: null,
    personas: PREDEFINED_PERSONAS,
    view: ViewState.HOME
  });

  const allPersonas = [...PREDEFINED_PERSONAS, ...customPersonas];

  useEffect(() => {
    setState(s => ({ ...s, personas: allPersonas }));
  }, [customPersonas]);

  const handleCreateConversation = (name: string, personaIds: string[]) => {
    if (state.conversations.length >= MAX_CONVERSATIONS) {
      alert("Nexus: Operational limit reached (10 swarms).");
      return;
    }

    const newConv: Conversation = {
      id: `nexus_${Date.now()}`,
      name: name || `Swarm ${state.conversations.length + 1}`,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      personaIds,
      messages: []
    };

    setState(s => ({
      ...s,
      conversations: [newConv, ...s.conversations],
      activeConversationId: newConv.id,
      view: ViewState.CHAT
    }));
  };

  const handleCreateCustomPersona = (persona: Persona) => {
    setCustomPersonas([...customPersonas, persona]);
    setState(s => ({ ...s, view: ViewState.CREATE_GROUP }));
  };

  const handleUpdateConversation = (updatedConv: Conversation) => {
    setState(s => ({
      ...s,
      conversations: s.conversations.map(c => c.id === updatedConv.id ? updatedConv : c)
    }));
  };

  const activeConversation = state.conversations.find(c => c.id === state.activeConversationId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Nexus Sidebar */}
      <div className={`${state.view === ViewState.CHAT ? 'hidden md:flex' : 'flex'} w-full md:w-auto z-20 border-r border-slate-800/50 shadow-2xl`}>
        <Sidebar
          conversations={state.conversations}
          activeId={state.activeConversationId}
          personas={state.personas}
          onSelect={(id) => setState(s => ({ ...s, activeConversationId: id, view: ViewState.CHAT }))}
          onCreateNew={() => setState(s => ({ ...s, view: ViewState.CREATE_GROUP }))}
        />
      </div>

      {/* Main Hub */}
      <div className="flex-1 flex flex-col h-full relative bg-[#0b0f19] md:rounded-l-[2rem] md:shadow-[-20px_0_60px_-10px_rgba(0,0,0,0.4)] overflow-hidden border-l border-slate-800/50">
        {state.view === ViewState.HOME && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
             <div className="max-w-md bg-slate-900/40 p-12 rounded-[2.5rem] border border-slate-800/50 glass">
                <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-3xl shadow-2xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-8 animate-bounce transition-all duration-[3000ms]">
                    <Sparkles className="text-white" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Swarm Architect</h2>
                <p className="text-slate-400 leading-relaxed mb-10">
                  Initialize a multi-agent neural pipeline to simulate complex interactions and strategic discussions.
                </p>
                <button 
                    onClick={() => setState(s => ({ ...s, view: ViewState.CREATE_GROUP }))}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                    Initialize Swarm
                </button>
             </div>
          </div>
        )}

        {state.view === ViewState.CREATE_GROUP && (
          <CreateGroup
            personas={state.personas}
            onCreate={handleCreateConversation}
            onCancel={() => setState(s => ({ ...s, view: ViewState.HOME }))}
            onCreatePersona={() => setState(s => ({ ...s, view: ViewState.CREATE_PERSONA }))}
          />
        )}

        {state.view === ViewState.CREATE_PERSONA && (
          <CreatePersona 
            onSave={handleCreateCustomPersona}
            onCancel={() => setState(s => ({ ...s, view: ViewState.CREATE_GROUP }))}
          />
        )}

        {state.view === ViewState.CHAT && activeConversation && (
          <ChatInterface
            conversation={activeConversation}
            allPersonas={state.personas}
            onUpdateConversation={handleUpdateConversation}
            onBack={() => setState(s => ({ ...s, view: ViewState.HOME }))}
          />
        )}
      </div>
    </div>
  );
};

export default App;
