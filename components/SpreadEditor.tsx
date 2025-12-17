import React from 'react';
import { Spread } from '../types';

interface SpreadEditorProps {
  spread: Spread;
  onRetry: (id: string) => void;
}

export const SpreadEditor: React.FC<SpreadEditorProps> = ({ spread, onRetry }) => {
  return (
    <div className="w-full max-w-6xl mx-auto my-12 perspective-1000">
      {/* Spread Container (The Book Look) */}
      <div className="flex flex-col lg:flex-row bg-paper spread-shadow min-h-[600px]">
        
        {/* Left Page: Text */}
        <div className="flex-1 p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col justify-center">
            <div className="mb-4 text-xs font-serif text-gray-400 uppercase tracking-widest">
                Page {spread.pageNumber * 2 - 1}
            </div>
            <div className="prose prose-lg font-serif text-ink whitespace-pre-wrap leading-relaxed">
                {spread.textContent}
            </div>
        </div>

        {/* Right Page: Illustration */}
        <div className="flex-1 p-4 lg:p-0 bg-gray-50 flex flex-col justify-center items-center relative overflow-hidden">
             <div className="absolute top-4 right-8 text-xs font-serif text-gray-400 uppercase tracking-widest z-10">
                Page {spread.pageNumber * 2}
            </div>

            {spread.status === 'idle' && (
                <div className="text-gray-400 font-serif italic">Waiting to generate...</div>
            )}

            {spread.status === 'generating' && (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-ink rounded-full animate-spin"></div>
                    <p className="font-hand text-gray-500 animate-pulse">Sketching...</p>
                </div>
            )}

            {spread.status === 'error' && (
                <div className="text-center p-8">
                    <p className="text-red-500 font-bold mb-2">Illustration Failed</p>
                    <p className="text-sm text-gray-600 mb-4">{spread.error}</p>
                    <button 
                        onClick={() => onRetry(spread.id)}
                        className="px-4 py-2 bg-ink text-white font-serif hover:bg-gray-800 transition"
                    >
                        Retry Sketch
                    </button>
                </div>
            )}

            {spread.status === 'success' && spread.imageUrl && (
                <div className="w-full h-full flex items-center justify-center bg-white">
                    <img 
                        src={spread.imageUrl} 
                        alt="Generated illustration" 
                        className="w-full h-full object-cover mix-blend-multiply" // Multiply blend mode for 'sketch on paper' effect
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
