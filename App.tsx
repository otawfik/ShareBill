
import React, { useState, useCallback, useMemo } from 'react';
import { AppState, Friend, ReceiptAnalysis, ReceiptItem } from './types';
import { GeminiService } from './services/geminiService';
import ReceiptUploader from './components/ReceiptUploader';
import FriendManager from './components/FriendManager';
import SplitterUI from './components/SplitterUI';
import Summary from './components/Summary';
import ImageEditor from './components/ImageEditor';

const INITIAL_FRIENDS: Friend[] = [
  { id: '1', name: 'Me', avatar: 'https://picsum.photos/seed/me/100' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    image: null,
    editedImage: null,
    analysis: null,
    friends: INITIAL_FRIENDS,
    assignments: {},
    status: 'idle',
    error: null,
  });

  const handleImageUpload = async (base64: string) => {
    setState(prev => ({ ...prev, image: base64, status: 'analyzing', error: null }));
    try {
      const result = await GeminiService.analyzeReceipt(base64);
      const initialAssignments: Record<string, string[]> = {};
      result.items.forEach(item => {
        initialAssignments[item.id] = [];
      });

      setState(prev => ({
        ...prev,
        analysis: result,
        assignments: initialAssignments,
        status: 'splitting'
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, status: 'idle', error: err.message }));
    }
  };

  const handleAddFriend = (name: string) => {
    const newFriend: Friend = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      avatar: `https://picsum.photos/seed/${name}/100`,
    };
    setState(prev => ({ ...prev, friends: [...prev.friends, newFriend] }));
  };

  const handleRemoveFriend = (id: string) => {
    if (id === '1') return;
    setState(prev => {
      const newFriends = prev.friends.filter(f => f.id !== id);
      const newAssignments = { ...prev.assignments };
      Object.keys(newAssignments).forEach(key => {
        newAssignments[key] = newAssignments[key].filter(fid => fid !== id);
      });
      return { ...prev, friends: newFriends, assignments: newAssignments };
    });
  };

  const handleToggleAssignment = (itemId: string, friendId: string) => {
    setState(prev => {
      const current = prev.assignments[itemId] || [];
      const updated = current.includes(friendId)
        ? current.filter(id => id !== friendId)
        : [...current, friendId];
      return {
        ...prev,
        assignments: { ...prev.assignments, [itemId]: updated }
      };
    });
  };

  const handleEditImage = async (prompt: string) => {
    const source = state.editedImage || state.image;
    if (!source) return;
    
    setState(prev => ({ ...prev, status: 'editing', error: null }));
    try {
      const result = await GeminiService.editImage(source, prompt);
      setState(prev => ({ ...prev, editedImage: result, status: 'splitting' }));
    } catch (err: any) {
      setState(prev => ({ ...prev, status: 'splitting', error: err.message }));
    }
  };

  const reset = () => {
    setState({
      image: null,
      editedImage: null,
      analysis: null,
      friends: INITIAL_FRIENDS,
      assignments: {},
      status: 'idle',
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={reset} style={{cursor: 'pointer'}}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ShareBill AI</h1>
          </div>
          {state.status !== 'idle' && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium">{state.error}</p>
          </div>
        )}

        {state.status === 'idle' && (
          <ReceiptUploader onUpload={handleImageUpload} />
        )}

        {state.status === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Analyzing Receipt...</p>
              <p className="text-sm text-gray-500">Gemini is reading your items and prices</p>
            </div>
          </div>
        )}

        {(state.status === 'splitting' || state.status === 'editing') && state.analysis && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <ImageEditor 
              image={state.editedImage || state.image || ''} 
              onEdit={handleEditImage}
              isProcessing={state.status === 'editing'}
            />

            <FriendManager 
              friends={state.friends} 
              onAdd={handleAddFriend} 
              onRemove={handleRemoveFriend} 
            />

            <SplitterUI 
              analysis={state.analysis}
              friends={state.friends}
              assignments={state.assignments}
              onToggle={handleToggleAssignment}
            />

            <Summary 
              analysis={state.analysis}
              friends={state.friends}
              assignments={state.assignments}
            />
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-gray-400 text-xs">
        <p>© 2024 ShareBill AI • Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
