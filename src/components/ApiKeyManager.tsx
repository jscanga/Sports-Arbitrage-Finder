// components/ApiKeyManager.tsx
'use client';
import { useState } from 'react';

export default function ApiKeyManager({ currentKey, onKeyUpdate }: { currentKey?: string, onKeyUpdate: (key: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('ODDS_API_KEY', apiKey);
      onKeyUpdate(apiKey);
      setIsOpen(false);
      setApiKey('');
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
      >
        🔑 API Key
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Update API Key</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Odds API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter your Odds API key..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get your key from <a href="https://the-odds-api.com/" target="_blank" className="text-blue-500 hover:underline">the-odds-api.com</a>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-neutral-700 text-white py-2 rounded-lg font-semibold hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!apiKey.trim() || isLoading}
                  className="flex-1 bg-emerald-500 text-white py-2 rounded-lg font-semibold hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Key'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}