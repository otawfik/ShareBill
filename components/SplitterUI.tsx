
import React from 'react';
import { ReceiptAnalysis, Friend } from '../types';

interface Props {
  analysis: ReceiptAnalysis;
  friends: Friend[];
  assignments: Record<string, string[]>;
  onToggle: (itemId: string, friendId: string) => void;
}

const SplitterUI: React.FC<Props> = ({ analysis, friends, assignments, onToggle }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-bold text-gray-900">Assign Items</h3>
        <span className="text-xs font-medium text-gray-400">TAP NAMES TO SPLIT</span>
      </div>

      <div className="space-y-3">
        {analysis.items.map(item => {
          const assignedFriends = assignments[item.id] || [];
          
          return (
            <div 
              key={item.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                  <p className="text-xs text-indigo-600 font-bold">
                    {analysis.currency || '$'}{item.price.toFixed(2)}
                  </p>
                </div>
                {assignedFriends.length > 0 && (
                  <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                    SPLIT {assignedFriends.length} WAYS
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {friends.map(friend => {
                  const isAssigned = assignedFriends.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => onToggle(item.id, friend.id)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all
                        ${isAssigned 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-2 ring-indigo-600 ring-offset-2' 
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
                      `}
                    >
                      <img 
                        src={friend.avatar} 
                        alt={friend.name} 
                        className={`w-5 h-5 rounded-full ${isAssigned ? 'border-white' : 'grayscale border-transparent'} border`} 
                      />
                      {friend.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SplitterUI;
