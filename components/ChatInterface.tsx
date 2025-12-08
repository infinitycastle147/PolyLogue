import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Menu, MoreVertical, Plus, User as UserIcon, X, Download, BarChart2, Lock } from 'lucide-react';
import { Conversation, Message, Persona, Poll } from '../types';
import { generateDiscussionFlow } from '../services/gemini';
import PollBubble from './PollBubble';

interface ChatInterfaceProps {
  conversation: Conversation;
  allPersonas: Persona[];
  onUpdateConversation: (updated: Conversation) => void;
  onBack: () => void;
}

const CHECKPOINT_MILESTONES = [50, 75, 90];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  conversation, 
  allPersonas, 
  onUpdateConversation,
  onBack
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typingPersonaId, setTypingPersonaId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  
  // Poll Creation State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Ref to hold the latest conversation state to avoid stale closures
  // This is the source of truth for async operations
  const conversationRef = useRef(conversation);

  // Sync ref when prop changes (from parent updates or initial load)
  useEffect(() => {
    // Only update ref if the prop has newer data or different ID
    if (conversation.id !== conversationRef.current.id || conversation.messages.length > conversationRef.current.messages.length) {
        conversationRef.current = conversation;
    }
  }, [conversation]);

  // Create a map for easy persona lookup
  const activePersonas = allPersonas.filter(p => conversation.personaIds.includes(p.id));
  const personaMap = useMemo(() => new Map(activePersonas.map(p => [p.id, p])), [activePersonas]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  // --- Core Message Update Logic with Race Condition Fix ---
  const updateMessages = (msg: Message) => {
    const currentConv = conversationRef.current;
    const updatedMessages = [...currentConv.messages, msg];
    
    const updatedConv = {
      ...currentConv,
      messages: updatedMessages,
      lastMessageAt: Date.now()
    };

    // 1. Optimistically update ref IMMEDIATELY
    conversationRef.current = updatedConv;
    
    // 2. Propagate to parent state
    onUpdateConversation(updatedConv);
  };
  // ---------------------------------------------------------

  // Auto Polls Check
  useEffect(() => {
    if (isConversationEnded) return;

    const checkAutoPolls = () => {
       const currentMessages = conversation.messages;
       const count = currentMessages.length;
       if (CHECKPOINT_MILESTONES.includes(count)) {
          const lastMsg = currentMessages[currentMessages.length - 1];
          if (lastMsg.type === 'POLL' && lastMsg.senderId === 'system') return;

          const newPoll: Poll = {
            id: Date.now().toString(),
            question: "Should we end this discussion?",
            options: [
              { id: 'opt1', text: "Yes, conclude now", votes: 0 },
              { id: 'opt2', text: "No, continue discussing", votes: 0 }
            ],
            isActive: true,
            createdBy: 'system'
          };
          
          const pollMsg: Message = {
            id: `sys_poll_${Date.now()}`,
            conversationId: conversation.id,
            senderId: 'system',
            text: "System Checkpoint",
            timestamp: Date.now(),
            type: 'POLL',
            pollData: newPoll
          };
          
          updateMessages(pollMsg);
       }
    };

    checkAutoPolls();
  }, [conversation.messages.length, isConversationEnded]);

  const processDiscussionFlow = async () => {
    if (processingRef.current || isConversationEnded) return;
    
    // Check if there is an active poll waiting for user vote.
    // If the last message is a POLL and the user hasn't voted (implied by logic that flow resumes after vote),
    // we should ideally wait. However, checking strict "userVoted" state is hard without tracking it on the poll object.
    // For now, we assume if processDiscussionFlow is called, it's safe to proceed.
    
    processingRef.current = true;
    setIsProcessing(true);

    try {
      let keepGoing = true;
      let cycles = 0;
      const MAX_CYCLES = 8; // Increased to allow deeper automated discussions

      while (keepGoing && cycles < MAX_CYCLES) {
          if (isConversationEnded) break;

          const currentMessages = conversationRef.current.messages;
          const currentActivePersonas = allPersonas.filter(p => conversationRef.current.personaIds.includes(p.id));
          
          const response = await generateDiscussionFlow(currentMessages, currentActivePersonas);

          if (!response || response.turns.length === 0) {
            keepGoing = false;
            break;
          }

          // Execute the sequence with delays
          for (const turn of response.turns) {
            // Check ended state again in loop
            if (isConversationEnded) break;

            // Validation: Ensure speaker exists in group
            if (!personaMap.has(turn.speakerId)) continue;

            // 1. Typing Indicator
            setTypingPersonaId(turn.speakerId);
            
            // Calculate dynamic reading/typing delay
            const delay = Math.min(4000, 1000 + (turn.text?.length || 0) * 20);
            await new Promise(resolve => setTimeout(resolve, delay));

            // 2. Add Message
            let newMessage: Message;
            
            if (turn.type === 'POLL' && turn.pollQuestion && turn.pollOptions) {
                const newPoll: Poll = {
                    id: Date.now().toString(),
                    question: turn.pollQuestion,
                    options: turn.pollOptions.map((opt, idx) => ({ id: idx.toString(), text: opt, votes: 0 })),
                    isActive: true,
                    createdBy: turn.speakerId
                };
                newMessage = {
                    id: `ai_msg_${Date.now()}`,
                    conversationId: conversation.id,
                    senderId: turn.speakerId,
                    text: turn.text || "I've created a poll.",
                    timestamp: Date.now(),
                    type: 'POLL',
                    pollData: newPoll
                };
                // If a poll is created, we pause the continuous flow loop to let users/personas vote.
                keepGoing = false; 
            } else {
                newMessage = {
                    id: `ai_msg_${Date.now()}`,
                    conversationId: conversation.id,
                    senderId: turn.speakerId,
                    text: turn.text,
                    timestamp: Date.now(),
                    type: 'TEXT'
                };
            }

            updateMessages(newMessage);
            setTypingPersonaId(null);

            if (!keepGoing) break; // Break inner loop if poll created

            // Small pause between speakers
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
          if (!keepGoing) break; // Break outer loop if poll created or flow stopped

          keepGoing = response.shouldContinue;
          cycles++;
          
          // Stop if user has reached max messages
          if (conversationRef.current.messages.length >= 100) {
             keepGoing = false;
          }

          if (keepGoing) {
             // Simulate "thinking" or "reading" before next batch
             await new Promise(resolve => setTimeout(resolve, 1500));
          }
      }

      processingRef.current = false;
      setIsProcessing(false);

    } catch (error) {
      console.error("Discussion flow error", error);
      processingRef.current = false;
      setIsProcessing(false);
      setTypingPersonaId(null);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isConversationEnded) return;

    const userMsg: Message = {
      id: `user_msg_${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'user',
      text: inputText.trim(),
      timestamp: Date.now(),
      type: 'TEXT'
    };

    updateMessages(userMsg);
    setInputText('');
    
    // Trigger the AI response flow
    setTimeout(() => processDiscussionFlow(), 500);
  };

  const handleCreatePoll = () => {
     if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return;

     const newPoll: Poll = {
       id: Date.now().toString(),
       question: pollQuestion,
       options: pollOptions.map((opt, idx) => ({ id: idx.toString(), text: opt, votes: 0 })),
       isActive: true,
       createdBy: 'user'
     };

     const msg: Message = {
       id: `user_poll_${Date.now()}`,
       conversationId: conversation.id,
       senderId: 'user',
       text: "Created a poll",
       timestamp: Date.now(),
       type: 'POLL',
       pollData: newPoll
     };

     updateMessages(msg);
     setShowPollModal(false);
     setPollQuestion('');
     setPollOptions(['', '']);
     
     // Note: We do NOT trigger processDiscussionFlow immediately. 
     // We wait for the user to vote first, which triggers the AI to vote and resume.
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (isConversationEnded) return;

    const currentConv = conversationRef.current;
    const msgIndex = currentConv.messages.findIndex(m => m.type === 'POLL' && m.pollData?.id === pollId);
    if (msgIndex === -1) return;

    const msg = currentConv.messages[msgIndex];
    if (!msg.pollData) return;

    // 1. User votes
    const updatedPoll = { ...msg.pollData };
    updatedPoll.options = updatedPoll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    // 2. Force ALL personas to vote immediately (per PRD requirement)
    // "All personas must vote"
    activePersonas.forEach(p => {
       // Simple AI voting logic: Random selection
       // In a more advanced version, we could ask the LLM to vote based on persona
       const randomOptionIndex = Math.floor(Math.random() * updatedPoll.options.length);
       updatedPoll.options[randomOptionIndex].votes += 1;
    });

    const updatedMsg = { ...msg, pollData: updatedPoll };
    const newMessages = [...currentConv.messages];
    newMessages[msgIndex] = updatedMsg;

    const updatedConv = {
        ...currentConv,
        messages: newMessages,
    };

    // Update state
    conversationRef.current = updatedConv;
    onUpdateConversation(updatedConv);

    // 3. Check Results & System Poll Logic
    if (updatedPoll.createdBy === 'system' && updatedPoll.question.includes("end this discussion")) {
        // Find winner
        const sortedOptions = [...updatedPoll.options].sort((a, b) => b.votes - a.votes);
        const winner = sortedOptions[0];
        
        // Tie breaker: Continue discussion (per PRD "In case of tie, discussion continues")
        const isTie = sortedOptions.length > 1 && sortedOptions[0].votes === sortedOptions[1].votes;
        
        if (!isTie && winner.text.toLowerCase().includes("conclude")) {
            // End Discussion
            setIsConversationEnded(true);
            const sysMsg: Message = {
                id: `sys_end_${Date.now()}`,
                conversationId: conversation.id,
                senderId: 'system',
                text: "The group has voted to end the discussion. Conversation closed.",
                timestamp: Date.now(),
                type: 'SYSTEM'
            };
            updateMessages(sysMsg);
            return;
        } else {
            // Continue Discussion
            const sysMsg: Message = {
                id: `sys_cont_${Date.now()}`,
                conversationId: conversation.id,
                senderId: 'system',
                text: "Majority voted to continue (or tie). Resuming discussion...",
                timestamp: Date.now(),
                type: 'SYSTEM'
            };
            updateMessages(sysMsg);
            // Resume flow
            setTimeout(() => processDiscussionFlow(), 1000);
            return;
        }
    }

    // 4. Resume normal discussion flow after poll results
    setTimeout(() => processDiscussionFlow(), 1500);
  };

  const handleExport = () => {
    let content = `Conversation: ${conversation.name}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    
    conversation.messages.forEach(msg => {
       const senderName = msg.senderId === 'user' ? 'User' : (msg.senderId === 'system' ? 'System' : personaMap.get(msg.senderId)?.name || 'Unknown');
       const time = new Date(msg.timestamp).toLocaleTimeString();
       
       if (msg.type === 'POLL' && msg.pollData) {
         content += `[${time}] ${senderName} (POLL): ${msg.pollData.question}\n`;
         msg.pollData.options.forEach(opt => {
            content += `   - ${opt.text}: ${opt.votes} votes\n`;
         });
       } else {
         content += `[${time}] ${senderName}: ${msg.text}\n`;
       }
       content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polylogue_${conversation.name.replace(/\s+/g, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const updateOption = (index: number, val: string) => {
    const newOpts = [...pollOptions];
    newOpts[index] = val;
    setPollOptions(newOpts);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-500">
            <Menu size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-800 text-sm sm:text-base">{conversation.name}</h2>
                {isConversationEnded && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Lock size={10}/> Closed</span>}
            </div>
            <div className="flex -space-x-2 mt-1">
               {activePersonas.map(p => (
                 <img 
                    key={p.id} 
                    src={p.avatarUrl} 
                    alt={p.name}
                    className="w-6 h-6 rounded-full border-2 border-white bg-gray-100"
                    title={p.name}
                 />
               ))}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
              <button 
                onClick={handleExport}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download size={16} />
                Export Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 scrollbar-hide">
        {conversation.messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p className="text-sm">Start the conversation to meet the group.</p>
          </div>
        )}

        {conversation.messages.map((msg) => {
          const isUser = msg.senderId === 'user';
          const isSystem = msg.senderId === 'system';
          const sender = (isUser || isSystem) ? null : personaMap.get(msg.senderId);

          if (isSystem && msg.type === 'POLL' && msg.pollData) {
             return (
               <div key={msg.id} className="flex w-full justify-center my-4">
                 <div className="w-full max-w-sm">
                   <div className="text-center text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">System Checkpoint</div>
                   <PollBubble poll={msg.pollData} onVote={handleVote} userVoted={false} />
                 </div>
               </div>
             )
          }

          if (isSystem && msg.type === 'SYSTEM') {
              return (
                <div key={msg.id} className="flex w-full justify-center my-2">
                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">{msg.text}</span>
                </div>
              );
          }

          if (msg.type === 'POLL' && msg.pollData) {
            return (
               <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && sender && (
                   <img src={sender.avatarUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1" alt={sender.name}/>
                  )}
                  <PollBubble 
                    poll={msg.pollData} 
                    onVote={handleVote} 
                    userVoted={false} 
                  />
               </div>
            );
          }

          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && sender && (
                <div className="flex flex-col items-center mr-2 self-end">
                   <img src={sender.avatarUrl} className="w-8 h-8 rounded-full mb-1 bg-gray-100 object-cover" alt={sender.name} />
                </div>
              )}
              
              <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                {!isUser && sender && (
                  <span className={`text-xs text-gray-500 mb-1 ml-1`}>{sender.name}</span>
                )}
                <div 
                  className={`px-4 py-2 rounded-2xl text-sm shadow-sm whitespace-pre-wrap
                    ${isUser 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}
                >
                  {msg.text}
                </div>
              </div>

              {isUser && (
                 <div className="flex flex-col items-center ml-2 self-end">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <UserIcon size={16} className="text-indigo-600"/>
                    </div>
                 </div>
              )}
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {typingPersonaId && (
          <div className="flex w-full justify-start animate-pulse">
             <div className="flex flex-col items-center mr-2 self-end">
                <img 
                  src={personaMap.get(typingPersonaId)?.avatarUrl} 
                  className="w-8 h-8 rounded-full mb-1 opacity-70 bg-gray-100" 
                  alt="typing"
                />
             </div>
             <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none flex space-x-1 items-center h-10">
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 pb-6 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {isConversationEnded ? (
             <div className="text-center py-2 text-gray-500 font-medium">
                 This conversation has concluded.
             </div>
        ) : (
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className="relative">
            <button 
              onClick={() => setShowPollModal(true)}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100"
              title="Create Poll"
            >
              <BarChart2 size={24} />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isProcessing ? "Group is discussing..." : "Type a message..."}
              disabled={conversation.messages.length >= 100}
              className="w-full bg-gray-100 text-gray-900 placeholder-gray-500 border-0 rounded-full px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || conversation.messages.length >= 100}
            className={`p-3 rounded-full transition-all ${
              inputText.trim() 
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        )}
        {conversation.messages.length >= 100 && !isConversationEnded && (
          <div className="text-center text-xs text-red-500 mt-2">
            Conversation limit reached (100 messages).
          </div>
        )}
      </div>

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Create New Poll</h3>
              <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input 
                  type="text" 
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask the group something..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 placeholder-gray-500"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button 
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowPollModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePoll}
                disabled={!pollQuestion.trim() || pollOptions.some(o => !o.trim())}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Post Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;