import React from 'react';
import { Poll } from '../types';
import { BarChart2 } from 'lucide-react';

interface PollBubbleProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  userVoted: boolean;
}

const PollBubble: React.FC<PollBubbleProps> = ({ poll, onVote, userVoted }) => {
  const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 w-full max-w-xs sm:max-w-sm my-2">
      <div className="flex items-center gap-2 mb-3 text-indigo-600">
        <BarChart2 size={18} />
        <span className="font-semibold text-xs uppercase tracking-wider">Group Poll</span>
      </div>
      
      <h3 className="font-bold text-gray-800 mb-4 text-sm">{poll.question}</h3>
      
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          
          return (
            <button
              key={option.id}
              onClick={() => !userVoted && onVote(poll.id, option.id)}
              disabled={userVoted}
              className={`relative w-full text-left p-3 rounded-md text-sm transition-all overflow-hidden ${
                userVoted 
                  ? 'bg-gray-50 cursor-default' 
                  : 'bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200'
              }`}
            >
              {/* Progress Bar Background */}
              {userVoted && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-indigo-100 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              <div className="relative flex justify-between items-center z-10">
                <span className="font-medium text-gray-700">{option.text}</span>
                {userVoted && (
                  <span className="text-xs font-bold text-indigo-600">{percentage}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-3 text-xs text-gray-400 text-right">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default PollBubble;