
import React, { useState } from 'react';
import { Friend } from '../types';

interface Props {
  friends: Friend[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

const FriendManager: React.FC<Props> = ({ friends, onAdd, onRemove }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Friends Involved</h3>
      
      <div className="flex flex-wrap gap-3 mb-6">
        {friends.map(friend => (
          <div 
            key={friend.id}
            className="group relative flex items-center bg-gray-50 rounded-full pl-1 pr-3 py-1 border border-gray-200"
          >
            <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-full border border-white" />
            <span className="ml-2 text-sm font-medium text-gray-700">{friend.name}</span>
            {friend.id !== '1' && (
              <button 
                onClick={() => onRemove(friend.id)}
                className="ml-2 w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a friend..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        <button 
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100"
        >
          Add
        </button>
      </form>
    </div>
  );
};

export default FriendManager;
