
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
interface Friend { id: string; name: string; avatar: string; }
interface ReceiptItem { id: string; name: string; price: number; }
interface ReceiptAnalysis {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
}
interface AppState {
  image: string | null;
  editedImage: string | null;
  analysis: ReceiptAnalysis | null;
  friends: Friend[];
  assignments: Record<string, string[]>;
  status: 'idle' | 'analyzing' | 'splitting' | 'editing';
  error: string | null;
}

// --- GEMINI SERVICE ---
// Use gemini-3-pro-preview for receipt analysis
const analyzeReceipt = async (base64Image: string): Promise<ReceiptAnalysis> => {
  // Always use process.env.API_KEY directly
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing!");
  
  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
        { text: "Extract items (id, name, price), subtotal, tax, tip, total. JSON format." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                id: { type: Type.STRING }, 
                name: { type: Type.STRING }, 
                price: { type: Type.NUMBER } 
              }, 
              required: ["id", "name", "price"] 
            } 
          },
          subtotal: { type: Type.NUMBER }, 
          tax: { type: Type.NUMBER }, 
          tip: { type: Type.NUMBER }, 
          total: { type: Type.NUMBER }, 
          currency: { type: Type.STRING }
        },
        required: ["items", "subtotal", "total"]
      }
    }
  });
  // Use .text property directly
  return JSON.parse(response.text || "{}");
};

// Use gemini-2.5-flash-image for image editing tasks
const editImageWithAI = async (base64Image: string, prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing!");

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("AI Edit failed.");
};

// --- UI COMPONENTS ---

const ReceiptUploader = ({ onUpload }: { onUpload: (b64: string) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Scan & Split</h2>
        <p className="text-gray-500 max-w-sm mx-auto">Snap a photo of the bill. Gemini AI handles the rest.</p>
      </div>
      <div 
        onClick={() => fileInputRef.current?.click()} 
        className="group border-4 border-dashed border-gray-200 rounded-[48px] p-16 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer shadow-sm hover:shadow-xl"
      >
        <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <p className="text-xl font-black text-gray-900">Upload Receipt</p>
        <p className="text-sm text-gray-400 mt-2">Tap to open camera or gallery</p>
        <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" capture="environment" className="hidden" />
      </div>
      <div className="grid grid-cols-3 gap-4 px-2">
        {['AI Scanner', 'Instant Math', 'Smart Split'].map((text, i) => (
          <div key={i} className="text-center">
            <div className="text-xl mb-1">{'✨⚡️🤝'[i * 2] + '✨⚡️🤝'[i * 2 + 1]}</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

const App = () => {
  const [state, setState] = useState<AppState>({
    image: null, editedImage: null, analysis: null, friends: [{ id: '1', name: 'Me', avatar: 'https://picsum.photos/seed/me/100' }], assignments: {}, status: 'idle', error: null
  });

  const handleUpload = async (base64: string) => {
    setState(s => ({ ...s, image: base64, status: 'analyzing', error: null }));
    try {
      const result = await analyzeReceipt(base64);
      const assigns: Record<string, string[]> = {};
      result.items.forEach(i => assigns[i.id] = []);
      setState(s => ({ ...s, analysis: result, assignments: assigns, status: 'splitting' }));
    } catch (err: any) {
      setState(s => ({ ...s, status: 'idle', error: err.message }));
    }
  };

  const handleAIEdit = async (prompt: string) => {
    if (!state.image) return;
    setState(s => ({ ...s, status: 'editing', error: null }));
    try {
      const b64 = await editImageWithAI(state.image, prompt);
      setState(s => ({ ...s, editedImage: b64, status: 'splitting' }));
    } catch (err: any) {
      setState(s => ({ ...s, status: 'splitting', error: "AI edit failed. Key might be restricted." }));
    }
  };

  const toggleAssign = (itemId: string, friendId: string) => {
    setState(s => {
      const curr = s.assignments[itemId] || [];
      const next = curr.includes(friendId) ? curr.filter(id => id !== friendId) : [...curr, friendId];
      return { ...s, assignments: { ...s.assignments, [itemId]: next } };
    });
  };

  if (state.status === 'analyzing') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-indigo-900">Gemini AI is reading...</h3>
        <p className="text-gray-400 animate-pulse">Extracting prices and items...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <header className="flex items-center justify-between mb-12 no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-100">S</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">ShareBill AI</h1>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Powered by Google Gemini</p>
          </div>
        </div>
        {state.status !== 'idle' && (
          <button onClick={() => window.location.reload()} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
        )}
      </header>

      {state.error && <div className="bg-red-50 text-red-600 p-6 rounded-3xl mb-8 font-bold border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">⚠️</div>
        {state.error}
      </div>}

      {state.status === 'idle' && <ReceiptUploader onUpload={handleUpload} />}

      {state.status === 'splitting' && state.analysis && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          
          {/* AI Image Preview & Editor */}
          <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100 no-print">
            <div className="relative aspect-[4/3] bg-gray-900">
              <img src={state.editedImage || state.image || ''} className="w-full h-full object-contain" />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={() => handleAIEdit("Enhance clarity and contrast")} className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl hover:bg-white">AI Enhance</button>
                <button onClick={() => handleAIEdit("Convert to BW scan style")} className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl hover:bg-white">B&W Mode</button>
              </div>
            </div>
          </div>

          {/* Friends Section */}
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 no-print">
            <h3 className="text-xl font-black mb-6">Friends</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              {state.friends.map(f => (
                <div key={f.id} className="flex items-center gap-2 bg-gray-50 pr-4 pl-1 py-1 rounded-full border border-gray-100">
                  <img src={f.avatar} className="w-10 h-10 rounded-full shadow-sm" />
                  <span className="text-sm font-bold">{f.name}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input id="newFriend" type="text" placeholder="Add name..." className="flex-1 bg-gray-100 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => {
                const el = document.getElementById('newFriend') as HTMLInputElement;
                if (el.value) {
                  const f = { id: Math.random().toString(), name: el.value, avatar: `https://picsum.photos/seed/${el.value}/100` };
                  setState(s => ({ ...s, friends: [...s.friends, f] }));
                  el.value = '';
                }
              }} className="bg-indigo-600 text-white font-black px-8 rounded-2xl shadow-lg shadow-indigo-100">Add</button>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4 no-print">
            <h3 className="text-xl font-black px-4">Assign Items</h3>
            {state.analysis.items.map((item) => {
              const assigned = state.assignments[item.id] || [];
              return (
                <div key={item.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:border-indigo-200 transition-all group">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                      <p className="text-indigo-600 font-black text-sm">${item.price.toFixed(2)}</p>
                    </div>
                    {assigned.length > 0 && <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-xl">SPLIT {assigned.length} WAYS</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.friends.map(f => {
                      const isActive = assigned.includes(f.id);
                      return (
                        <button key={f.id} onClick={() => toggleAssign(item.id, f.id)} className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-200'}`}>
                          {f.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Section */}
          <div className="bg-gray-900 rounded-[48px] p-10 text-white shadow-2xl space-y-8">
            <div className="border-b border-gray-800 pb-8">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Amount</p>
              <h2 className="text-6xl font-black">${state.analysis.total.toFixed(2)}</h2>
            </div>
            <div className="space-y-4">
              {state.friends.map(f => {
                let share = 0;
                state.analysis?.items.forEach(i => {
                  const assigned = state.assignments[i.id] || [];
                  if (assigned.includes(f.id)) share += i.price / assigned.length;
                });
                const ratio = share / (state.analysis?.subtotal || 1);
                const fees = ratio * ((state.analysis?.tax || 0) + (state.analysis?.tip || 0));
                const total = share + fees;
                if (total === 0) return null;
                return (
                  <div key={f.id} className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={f.avatar} className="w-10 h-10 rounded-full" />
                      <span className="font-bold text-lg">{f.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">${total.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black">Fees: ${fees.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => window.print()} className="w-full bg-indigo-600 py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all no-print">Download Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
