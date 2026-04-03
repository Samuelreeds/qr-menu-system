"use client";

import React, { useState, useRef } from "react";
import { Sparkles, UploadCloud, Wand2, Check, X, Loader2 } from "lucide-react";

const THEMES = [
  "Wooden Cafe Table",
  "Minimalist White",
  "Dark Moody Slate",
  "Marble Kitchen Counter",
  "Bright Sunny Window",
  "Neon Cyberpunk"
];

export default function AiImageGenerator({ 
  onClose, 
  onApply 
}: { 
  onClose: () => void; 
  onApply: (imageUrl: string) => void; 
}) {
  const [step, setStep] = useState<"upload" | "prompt" | "generating" | "result">("upload");
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    setStep("generating");
    setTimeout(() => {
      setGeneratedImage("https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=800&q=80");
      setStep("result");
    }, 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setRawImage(url);
      setStep("prompt");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">AI Studio</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          
          {step === "upload" && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-64 border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 transition-colors group">
                <UploadCloud size={40} className="text-purple-300 mb-4 group-hover:text-purple-500 transition-colors" />
                <p className="font-bold text-gray-700">Upload Raw Photo</p>
                <p className="text-xs text-gray-500 mt-1">Take a quick picture with your phone</p>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          )}

          {step === "prompt" && rawImage && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="w-full h-48 bg-gray-100 rounded-2xl overflow-hidden relative shrink-0">
                <img src={rawImage} alt="Raw" className="w-full h-full object-cover opacity-80" />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">Original</div>
              </div>
              
              <div className="flex-1 flex flex-col mt-2">
                <label className="block text-sm font-bold text-gray-800 mb-3">Select Background Theme</label>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-2">
                  {THEMES.map(theme => (
                    <button 
                      key={theme} 
                      onClick={() => setSelectedTheme(theme)} 
                      className={`p-3 text-sm font-bold rounded-xl border-2 transition-all text-left flex items-center justify-between ${selectedTheme === theme ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}
                    >
                      <span>{theme}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
                  <Wand2 size={40} className="text-purple-600" />
                </div>
                <Loader2 size={120} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500 animate-spin opacity-20" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-lg mb-1">Applying AI Magic...</h4>
                <p className="text-sm text-gray-500">Rendering {selectedTheme}</p>
              </div>
            </div>
          )}

          {step === "result" && generatedImage && (
            <div className="flex-1 flex flex-col space-y-4">
               <div className="w-full flex-1 bg-gray-100 rounded-2xl overflow-hidden relative shadow-inner border border-gray-200">
                <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                  <Sparkles size={10} /> AI Generated
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
          {step === "prompt" && (
            <button onClick={handleGenerate} disabled={!selectedTheme} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles size={18} /> Generate Image
            </button>
          )}
          {step === "result" && generatedImage && (
            <div className="flex gap-3">
              <button onClick={() => setStep("prompt")} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all active:scale-95 text-sm">
                Try Again
              </button>
              <button onClick={() => onApply(generatedImage)} className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                <Check size={18} /> Use this Image
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}