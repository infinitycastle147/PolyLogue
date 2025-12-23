
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Send, Menu, MoreVertical, Plus, User as UserIcon, X, Download, BarChart2, Lock, Cpu } from 'lucide-react';
import { Conversation, Message, Persona, Poll } from '../types';
import { generateDiscussionFlow, DiscussionTurn } from '../services/gemini';
import PollBubble from './PollBubble';
import Avatar from './Avatar';

const MessageBubble = memo(({ msg, sender, isUser, isSequence, isSystem, onVote }: any) => {
  if (isSystem) return <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-mono py-4">{msg.text}</div>;

  return (
    <div className={`flex w-full group ${isUser ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-1' : 'mt-6 animate-in slide-in-from-bottom-2 duration-300'}`}>
      {!isUser && sender && !isSequence && (
        <div className="mr-3 self-end mb-1">
           <Avatar src={sender.avatarUrl} name={sender.name} color={sender.color} className="w-8 h-8 rounded-xl border border-white/5" />
        </div>
      )}
      {isSequence && !isUser && <div className="w-11" />}
      
      <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && sender && !isSequence && (
          <span className="text-[10px] text-slate-500 mb-1.5 ml-1 font-bold tracking-tight uppercase">{sender.name}</span>
        )}
        <div 
          className={`px-5 py-3 text-[14px] leading-relaxed whitespace-pre-wrap shadow-2xl transition-all
            ${isUser 
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm border border-indigo-500/20' 
              : 'bg-slate-800/60 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-sm backdrop-blur-md'
            }`}
        >
          {msg.type === 'POLL' && msg.pollData ? (
            <PollBubble poll={msg.pollData} onVote={onVote} userVoted={!!msg.pollData.hasUserVoted} />
          ) : msg.text}
        </div>
      </div>

      {isUser && !isSequence && (
         <div className="ml-3 self-end mb-1">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <UserIcon size={14} />
            </div>
         </div>
      )}
    </div>
  );
});

interface ChatInterfaceProps {
  conversation: Conversation;
  allPersonas: Persona[];
  onUpdateConversation: (updated: Conversation) => void;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  conversation, 
  allPersonas, 
  onUpdateConversation,
  onBack
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typingPersonaId, setTypingPersonaId] = useState<string | null>(null);
  const [playbackQueue, setPlaybackQueue] = useState<DiscussionTurn[]>([]);
  
  const conversationRef = useRef(conversation);
  const isComponentMounted = useRef(true);
  const playbackActive = useRef(false);

  useEffect(() => {
    isComponentMounted.current = true;
    conversationRef.current = conversation;
    return () => { isComponentMounted.current = false; };
  }, [conversation]);

  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    allPersonas.forEach(p => map.set(p.id, p));
    return map;
  }, [allPersonas]);

  const activePersonas = useMemo(() => 
    conversation.personaIds.map(id => personaMap.get(id)).filter(Boolean) as Persona[]
  , [conversation.personaIds, personaMap]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [conversation.messages, typingPersonaId, scrollToBottom]);

  const updateMessages = useCallback((msg: Message) => {
    const current = conversationRef.current;
    onUpdateConversation({
      ...current,
      messages: [...current.messages, msg],
      lastMessageAt: Date.now()
    });
  }, [onUpdateConversation]);

  useEffect(() => {
    const processQueue = async () => {
      if (playbackActive.current || playbackQueue.length === 0) return;
      
      playbackActive.current = true;
      const turn = playbackQueue[0];
      
      // Verification: Ensure speakerId exists in the current conversation room
      if (!conversationRef.current.personaIds.includes(turn.speakerId)) {
        setPlaybackQueue(prev => prev.slice(1));
        playbackActive.current = false;
        return;
      }

      const sender = personaMap.get(turn.speakerId);
      if (sender) {
        setTypingPersonaId(turn.speakerId);
        const delay = Math.min(2500, 600 + (turn.text?.length || 0) * 12);
        await new Promise(r => setTimeout(r, delay));
        
        if (isComponentMounted.current) {
          const newMessage: Message = {
            id: `nx_${Date.now()}_${Math.random()}`,
            conversationId: conversationRef.current.id,
            senderId: turn.speakerId,
            text: turn.text || "...",
            timestamp: Date.now(),
            type: turn.type === 'POLL' ? 'POLL' : 'TEXT'
          };

          if (turn.type === 'POLL' && turn.pollQuestion && turn.pollOptions) {
            newMessage.pollData = {
              id: `poll_${Date.now()}`,
              question: turn.pollQuestion,
              options: turn.pollOptions.map((o, i) => ({ id: i.toString(), text: o, votes: 0 })),
              isActive: true,
              createdBy: turn.speakerId,
              hasUserVoted: false
            };
          }
          
          updateMessages(newMessage);
          setTypingPersonaId(null);
          setPlaybackQueue(prev => prev.slice(1));
          await new Promise(r => setTimeout(r, 400));
        }
      } else {
          setPlaybackQueue(prev => prev.slice(1));
      }
      playbackActive.current = false;
    };

    processQueue();
  }, [playbackQueue, personaMap, updateMessages]);

  const processDiscussionFlow = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      let cycles = 0;
      let shouldContinue = true;

      while (shouldContinue && cycles < 3) {
        const response = await generateDiscussionFlow(
            conversationRef.current.messages, 
            activePersonas
        );
        
        if (!response || !response.turns.length) break;
        
        setPlaybackQueue(prev => [...prev, ...response.turns]);
        
        shouldContinue = response.shouldContinue;
        cycles++;
        if (shouldContinue) await new Promise(r => setTimeout(r, 500));
      }
    } finally {
      if (isComponentMounted.current) setIsProcessing(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'user',
      text: inputText.trim(),
      timestamp: Date.now(),
      type: 'TEXT'
    };

    updateMessages(userMsg);
    setInputText('');
    setTimeout(processDiscussionFlow, 300);
  };

  const handleVote = useCallback((pollId: string, optionId: string) => {
    const currentConv = conversationRef.current;
    const msgIndex = currentConv.messages.findIndex(m => m.type === 'POLL' && m.pollData?.id === pollId);
    if (msgIndex === -1) return;

    const msg = currentConv.messages[msgIndex];
    if (!msg.pollData || msg.pollData.hasUserVoted) return;

    const updatedPoll: Poll = { 
        ...msg.pollData,
        hasUserVoted: true 
    };
    
    updatedPoll.options = updatedPoll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    // AI Swarm Participation Simulation
    activePersonas.forEach(() => {
       const idx = Math.floor(Math.random() * updatedPoll.options.length);
       updatedPoll.options[idx].votes += 1;
    });

    const newMessages = [...currentConv.messages];
    newMessages[msgIndex] = { ...msg, pollData: updatedPoll };
    
    onUpdateConversation({ ...currentConv, messages: newMessages });
    
    // Trigger orchestration after vote to analyze results
    const flowTimeout = setTimeout(processDiscussionFlow, 1000);
    return () => clearTimeout(flowTimeout);
  }, [activePersonas, onUpdateConversation]);

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] relative">
      <div className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xl shadow-black/20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl transition-all">
            <Menu size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
                    <Cpu size={18} className="text-indigo-400" />
                </div>
                <h2 className="font-bold text-white text-lg tracking-tight">{conversation.name}</h2>
            </div>
            <div className="flex -space-x-1.5 mt-2">
               {activePersonas.map(p => (
                 <Avatar key={p.id} name={p.name} src={p.avatarUrl} color={p.color} className="w-5 h-5 ring-2 ring-[#0f172a] opacity-80" />
               ))}
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8 pb-32 scrollbar-hide">
        {conversation.messages.map((msg, idx) => {
          const isUser = msg.senderId === 'user';
          const isSystem = msg.senderId === 'system';
          const sender = isUser ? null : personaMap.get(msg.senderId);
          const isSequence = idx > 0 && conversation.messages[idx-1].senderId === msg.senderId;

          return (
            <MessageBubble 
              key={msg.id} 
              msg={msg} 
              sender={sender} 
              isUser={isUser} 
              isSequence={isSequence} 
              isSystem={isSystem} 
              onVote={handleVote} 
            />
          );
        })}
        
        {typingPersonaId && (
          <div className="flex w-full justify-start mt-6 animate-pulse">
             <div className="mr-3 self-end">
                <Avatar src={personaMap.get(typingPersonaId)?.avatarUrl} name="..." color="#444" className="w-8 h-8 opacity-50" />
             </div>
             <div className="bg-slate-800/40 border border-slate-700/30 px-5 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
               <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
               <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
               <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-10 z-10">
        <div className="flex items-center gap-3 max-w-5xl mx-auto bg-slate-900/80 backdrop-blur-2xl p-2.5 pl-5 pr-2.5 rounded-[2rem] border border-slate-800 shadow-2xl">
          <button className="p-2.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all">
            <BarChart2 size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isProcessing ? "Processing neural stream..." : "Broadcast to swarm..."}
            className="flex-1 bg-transparent text-white placeholder-slate-600 border-none py-3 focus:ring-0 text-sm font-medium outline-none"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            className={`p-3.5 rounded-2xl transition-all duration-500 transform ${
              inputText.trim() && !isProcessing
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-1' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
