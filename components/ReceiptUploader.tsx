
import React, { useRef } from 'react';

interface Props {
  onUpload: (base64: string) => void;
}

const ReceiptUploader: React.FC<Props> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Scan a Receipt</h2>
        <p className="text-gray-500">Upload a photo of your receipt to start splitting.</p>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="group relative border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer"
      >
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">Take Photo or Upload</p>
          <p className="text-sm text-gray-400 mt-1">Supports JPG, PNG up to 10MB</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*" 
          capture="environment"
          className="hidden" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'AI Powered', desc: 'Gemini handles the heavy lifting', icon: '✨' },
          { title: 'Quick Splitting', desc: 'Divide items in seconds', icon: '⚡' },
          { title: 'Photo Edits', desc: 'Enhance your receipt image', icon: '🎨' },
        ].map((feat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="text-2xl mb-1">{feat.icon}</div>
            <h3 className="font-bold text-gray-900 text-sm">{feat.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceiptUploader;
