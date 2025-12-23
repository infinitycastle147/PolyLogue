
import React, { useMemo } from 'react';
import { Poll } from '../types';
import { BarChart2, Activity } from 'lucide-react';

interface PollBubbleProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  userVoted: boolean;
}

const PollBubble: React.FC<PollBubbleProps> = ({ poll, onVote, userVoted }) => {
  const totalVotes = useMemo(() => 
    poll.options.reduce((acc, curr) => acc + curr.votes, 0),
    [poll.options]
  );

  return (
    <div className="bg-[#131825]/90 backdrop-blur-md p-6 rounded-3xl border border-white/5 w-full max-w-xs sm:max-w-md my-3 relative overflow-hidden shadow-2xl">
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-indigo-400">
            <Activity size={14} className="animate-pulse" />
            <span className="font-bold text-[10px] uppercase tracking-widest font-mono">Neural Consensus Poll</span>
        </div>
        <div className="px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
            <span className="text-[10px] font-bold text-indigo-400 font-mono">ACTIVE</span>
        </div>
      </div>
      
      <h3 className="font-bold text-white mb-6 text-sm leading-relaxed tracking-tight">{poll.question}</h3>
      
      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          
          return (
            <button
              key={option.id}
              onClick={() => !userVoted && onVote(poll.id, option.id)}
              disabled={userVoted}
              className={`relative w-full text-left p-0.5 rounded-2xl transition-all group ${
                userVoted 
                  ? 'cursor-default' 
                  : 'hover:scale-[1.02] active:scale-95'
              }`}
            >
              <div className={`relative overflow-hidden rounded-2xl border transition-colors duration-500 ${userVoted ? 'border-white/5 bg-black/40' : 'border-slate-800 bg-slate-900/50 group-hover:border-indigo-500/50 group-hover:bg-slate-900'}`}>
                {/* Progress Bar */}
                {userVoted && (
                    <div 
                    className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 transition-all duration-1000 ease-out border-r border-indigo-500/30"
                    style={{ width: `${percentage}%` }}
                    />
                )}
                
                <div className="relative flex justify-between items-center z-10 p-3.5">
                    <span className={`text-xs font-bold tracking-wide ${userVoted ? 'text-slate-300' : 'text-slate-400 group-hover:text-white'}`}>{option.text}</span>
                    {userVoted && (
                    <span className="text-[11px] font-black text-indigo-400 font-mono">{percentage}%</span>
                    )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 text-[9px] font-bold text-slate-600 uppercase tracking-widest flex justify-between items-center font-mono">
        <span>{userVoted ? 'Consensus Reached' : 'Pending Direct Input'}</span>
        <span className="text-slate-500">{totalVotes} VOTES REGISTERED</span>
      </div>
    </div>
  );
};

export default PollBubble;
