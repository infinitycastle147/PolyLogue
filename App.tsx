import React, { useState, useEffect } from 'react';
import { AppState, Conversation, ViewState, Message, Persona } from './types';
import { MAX_CONVERSATIONS, PREDEFINED_PERSONAS } from './constants';
import { initializeGemini } from './services/gemini';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CreateGroup from './components/CreateGroup';
import CreatePersona from './components/CreatePersona';
import { Key } from 'lucide-react';

const App: React.FC = () => {
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [state, setState] = useState<AppState>({
    conversations: [],
    activeConversationId: null,
    personas: PREDEFINED_PERSONAS,
    view: ViewState.API_KEY // Start by forcing API Key entry for demo purposes
  });

  const [apiKeyInput, setApiKeyInput] = useState('');

  // Combine predefined and custom personas
  const allPersonas = [...PREDEFINED_PERSONAS, ...customPersonas];

  // Auto-load API Key if in env (for dev convenience if configured via webpack/vite define plugin, otherwise empty)
  useEffect(() => {
    // Check if process.env.API_KEY is available (bundled)
    const envKey = process.env.API_KEY;
    if (envKey) {
       initializeGemini(envKey);
       setState(s => ({ ...s, view: ViewState.HOME }));
    }
  }, []);

  // Update state personas whenever custom personas change
  useEffect(() => {
    setState(s => ({ ...s, personas: allPersonas }));
  }, [customPersonas]);

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      initializeGemini(apiKeyInput.trim());
      setState(s => ({ ...s, view: ViewState.HOME }));
    }
  };

  const handleCreateConversation = (name: string, personaIds: string[]) => {
    if (state.conversations.length >= MAX_CONVERSATIONS) {
      alert("Maximum conversation limit reached.");
      return;
    }

    const newConv: Conversation = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      personaIds,
      messages: []
    };

    setState(s => ({
      ...s,
      conversations: [newConv, ...s.conversations], // Add to top
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

  // Render Logic
  if (state.view === ViewState.API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to PolyLogue</h1>
          <p className="text-gray-500 mb-6">Enter your Google Gemini API Key to start simulating multi-persona conversations.</p>
          
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 mb-4 outline-none"
          />
          
          <button
            onClick={handleApiKeySubmit}
            disabled={!apiKeyInput}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              apiKeyInput 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Start
          </button>
          <p className="text-xs text-gray-400 mt-4">
             Your key is used only locally for this session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      {/* Sidebar - Hidden on mobile if in chat mode */}
      <div className={`${state.view === ViewState.CHAT ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <Sidebar
          conversations={state.conversations}
          activeId={state.activeConversationId}
          personas={state.personas}
          onSelect={(id) => setState(s => ({ ...s, activeConversationId: id, view: ViewState.CHAT }))}
          onCreateNew={() => setState(s => ({ ...s, view: ViewState.CREATE_GROUP }))}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {state.view === ViewState.HOME && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
             <div className="max-w-md">
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Select a Conversation</h2>
                <p>Choose an existing group from the sidebar or create a new one to begin exploring perspectives.</p>
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