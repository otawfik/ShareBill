
import React, { useState } from 'react';

interface Props {
  image: string;
  onEdit: (prompt: string) => void;
  isProcessing: boolean;
}

const ImageEditor: React.FC<Props> = ({ image, onEdit, isProcessing }) => {
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const SUGGESTIONS = [
    "Make it black and white",
    "Add a vintage photo filter",
    "Increase contrast and brightness",
    "Make it look like a drawing",
    "Remove the background shadows"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onEdit(prompt.trim());
      setPrompt('');
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative aspect-[4/3] bg-gray-900 group">
        <img 
          src={image} 
          alt="Receipt" 
          className={`w-full h-full object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-100'}`} 
        />
        
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center flex-col bg-black/20 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-white text-sm font-bold">Applying AI Edits...</p>
          </div>
        )}

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-gray-900 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl hover:bg-white transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          AI Photo Edit
        </button>
      </div>

      {isOpen && (
        <div className="p-6 border-t border-gray-100 bg-indigo-50/30 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-indigo-900">AI Image Enhancement</h4>
            <button onClick={() => setIsOpen(false)} className="text-indigo-400 hover:text-indigo-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. 'Add a retro filter' or 'Enhance text clarity'..."
              className="w-full bg-white border border-indigo-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
              autoFocus
            />
            
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button 
                  key={i}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="text-[10px] bg-white text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <button 
              type="submit"
              disabled={isProcessing || !prompt.trim()}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              Generate AI Edit
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;
