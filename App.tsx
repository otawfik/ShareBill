
import React, { useState } from 'react';
import ReceiptUploader from './components/ReceiptUploader';
import FriendManager from './components/FriendManager';
import SplitterUI from './components/SplitterUI';
import Summary from './components/Summary';
import ImageEditor from './components/ImageEditor';
import { GeminiService } from './services/geminiService';
import { AppState, Friend } from './types';

// Main App component using modularized components and GeminiService
const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    image: null,
    editedImage: null,
    analysis: null,
    friends: [{ id: '1', name: 'Me', avatar: 'https://picsum.photos/seed/me/100' }],
    assignments: {},
    status: 'idle',
    error: null,
  });

  // Handle receipt analysis using Gemini
  const handleUpload = async (base64: string) => {
    setState(s => ({ ...s, image: base64, status: 'analyzing', error: null }));
    try {
      const result = await GeminiService.analyzeReceipt(base64);
      const assigns: Record<string, string[]> = {};
      result.items.forEach(i => {
        assigns[i.id] = [];
      });
      setState(s => ({ ...s, analysis: result, assignments: assigns, status: 'splitting' }));
    } catch (err: any) {
      setState(s => ({ ...s, status: 'idle', error: err.message }));
    }
  };

  // Handle AI image editing
  const handleEditImage = async (prompt: string) => {
    if (!state.image) return;
    setState(s => ({ ...s, status: 'editing', error: null }));
    try {
      const editedBase64 = await GeminiService.editImage(state.image, prompt);
      setState(s => ({ ...s, editedImage: editedBase64, status: 'splitting' }));
    } catch (err: any) {
      setState(s => ({ ...s, status: 'splitting', error: err.message }));
    }
  };

  const toggleAssign = (itemId: string, friendId: string) => {
    setState(s => {
      const curr = s.assignments[itemId] || [];
      const next = curr.includes(friendId) 
        ? curr.filter(id => id !== friendId) 
        : [...curr, friendId];
      return { ...s, assignments: { ...s.assignments, [itemId]: next } };
    });
  };

  const addFriend = (name: string) => {
    const f: Friend = { 
      id: Math.random().toString(36).substr(2, 9), 
      name, 
      avatar: `https://picsum.photos/seed/${name}/100` 
    };
    setState(s => ({ ...s, friends: [...s.friends, f] }));
  };

  const removeFriend = (id: string) => {
    setState(s => ({
      ...s,
      friends: s.friends.filter(f => f.id !== id),
      assignments: Object.fromEntries(
        Object.entries(s.assignments).map(([itemId, friendIds]) => [
          itemId,
          friendIds.filter(fId => fId !== id)
        ])
      )
    }));
  };

  if (state.status === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-indigo-900">Gemini is analyzing...</h2>
        <p className="text-gray-500 mt-2">Extracting items and totals from your receipt.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">S</div>
            <h1 className="text-2xl font-black text-gray-900 italic">ShareBill AI</h1>
          </div>
          {state.status !== 'idle' && (
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Reset
            </button>
          )}
        </header>

        {state.error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 font-medium text-sm border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {state.error}
          </div>
        )}

        {state.status === 'idle' && <ReceiptUploader onUpload={handleUpload} />}

        {(state.status === 'splitting' || state.status === 'editing') && state.analysis && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <ImageEditor 
              image={state.editedImage || state.image || ''} 
              onEdit={handleEditImage}
              isProcessing={state.status === 'editing'}
            />

            <FriendManager 
              friends={state.friends} 
              onAdd={addFriend} 
              onRemove={removeFriend} 
            />

            <SplitterUI 
              analysis={state.analysis}
              friends={state.friends}
              assignments={state.assignments}
              onToggle={toggleAssign}
            />

            <Summary 
              analysis={state.analysis}
              friends={state.friends}
              assignments={state.assignments}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
