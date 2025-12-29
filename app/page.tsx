'use client';

import { useState, useEffect } from 'react';

interface Idea {
  Timestamp: string;
  Idea: string;
  Caption: string;
  Visual: string;
  Source: string;
  ImageLink: string;
  'postedOnInsta?': string;
}

// const GENERATE_ENDPOINT = 'https://atifarif.app.n8n.cloud/webhook-test/content-generation';
const GENERATE_ENDPOINT = 'https://atifarif.app.n8n.cloud/webhook/content-generation'
// const POST_ENDPOINT = 'https://atifarif.app.n8n.cloud/webhook-test/post-content';
const POST_ENDPOINT = 'https://atifarif.app.n8n.cloud/webhook/post-content'
export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingImageLinks, setEditingImageLinks] = useState<Record<number, string>>({});
  const [postingIndex, setPostingIndex] = useState<number | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    loadIdeas();
  }, []);

  const parseCSV = (csvText: string): Idea[] => {
    if (!csvText || csvText.trim().length === 0) return [];

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < csvText.length) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote (double quote)
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (char === ',' && !inQuotes) {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        // Row separator (only if not in quotes)
        if (char === '\r' && nextChar === '\n') {
          i += 2; // Skip \r\n
        } else {
          i++; // Skip \n
        }
        
        // Add current field and row
        if (currentField.trim() || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some(field => field.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        }
        continue;
      }

      // Regular character
      currentField += char;
      i++;
    }

    // Add the last field and row if they exist
    if (currentField.trim() || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length === 0) return [];

    // First row is headers
    const headers = rows[0].map(h => h.trim());
    const parsedIdeas: Idea[] = [];

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const idea: any = {};
      
      headers.forEach((header, index) => {
        // Ensure we have a value for each header, even if row is shorter
        const value = row[index] !== undefined ? row[index] : '';
        idea[header] = value.trim();
      });

      // Only add if it has required fields and is not empty
      if (idea.Timestamp && idea.Idea && idea.Timestamp.length > 0 && idea.Idea.length > 0) {
        parsedIdeas.push(idea as Idea);
      }
    }

    return parsedIdeas;
  };

  const loadIdeas = async () => {
    setLoading(true);
    try {
      // Use Next.js API route to avoid CORS issues
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error('Failed to fetch ideas');
      }
      const { data: csvText } = await response.json();
      const parsedIdeas = parseCSV(csvText);
      setIdeas(parsedIdeas);
      
      // Initialize editing state
      const initialEditing: Record<number, string> = {};
      parsedIdeas.forEach((idea, index) => {
        initialEditing[index] = idea.ImageLink || '';
      });
      setEditingImageLinks(initialEditing);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error loading ideas: ${error.message}. Make sure the Google Sheet is publicly accessible.` });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    // Show disclaimer first
    setShowDisclaimer(true);
  };

  const confirmGenerate = async () => {
    setShowDisclaimer(false);
    setMessage({ type: 'success', text: 'Generation started! Please wait 2-3 minutes, then refresh to see new ideas.' });
    
    try {
      const response = await fetch(GENERATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'generate-only',
          triggeredBy: 'Webhook'
        })
      });

      if (response.ok) {
        // Don't auto-refresh, let user refresh manually after waiting
        setMessage({ type: 'success', text: 'Generation request sent! Please wait 2-3 minutes, then click "Refresh Ideas" to see new content.' });
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error generating content: ${error.message}` });
    }
  };

  const postToInstagram = async (index: number) => {
    const idea = ideas[index];
    const imageLink = editingImageLinks[index] || idea.ImageLink;

    if (!idea.Caption) {
      setMessage({ type: 'error', text: 'Caption is required' });
      return;
    }

    if (!imageLink) {
      setMessage({ type: 'error', text: 'Image Link is required' });
      return;
    }

    setPostingIndex(index);
    setMessage({ type: 'success', text: 'Posting to Instagram...' });

    try {
      const response = await fetch(POST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: idea.Caption,
          imageLink: imageLink,
          source: idea.Source
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Post published to Instagram successfully!' });
        setTimeout(() => {
          loadIdeas();
          setMessage(null);
          setPostingIndex(null);
        }, 2000);
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error posting to Instagram: ${error.message}` });
      setPostingIndex(null);
    }
  };

  const updateImageLink = (index: number, value: string) => {
    setEditingImageLinks(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-scaleIn">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <span className="text-3xl">⏱️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Generation Time
            </h3>
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              Content generation typically takes <strong className="text-purple-600">2-3 minutes</strong> to complete. 
              After clicking "Generate", please wait and then click <strong>"Refresh Ideas"</strong> to see your new content appear.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmGenerate}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Generate Ideas
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              📱
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Instagram Automation
              </h1>
              <p className="text-purple-200 text-lg">Manage and post your content ideas</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <button
              onClick={generateContent}
              className="group px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 shadow-lg relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                ✨ Generate New Ideas
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button
              onClick={loadIdeas}
              className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 shadow-lg"
            >
              🔄 Refresh Ideas
            </button>
            {message && (
              <div className={`flex-1 p-4 rounded-xl backdrop-blur-sm ${
                message.type === 'success' 
                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30' 
                  : 'bg-red-500/20 text-red-100 border border-red-400/30'
              }`}>
                <span className="font-semibold">{message.type === 'success' ? '✅' : '❌'}</span> {message.text}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-xl font-semibold">Loading ideas...</p>
          </div>
        )}

        {!loading && ideas.length === 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-white/20">
            <div className="text-6xl mb-4">💡</div>
            <p className="text-white text-xl font-semibold mb-2">No ideas found</p>
            <p className="text-purple-200">Click "Generate New Ideas" to create some!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea, index) => {
            const isPosted = idea['postedOnInsta?']?.toUpperCase() === 'TRUE';
            const imageLink = editingImageLinks[index] !== undefined ? editingImageLinks[index] : idea.ImageLink;

            return (
              <div
                key={index}
                className={`group bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 transition-all duration-300 hover:shadow-purple-500/20 hover:-translate-y-2 border border-white/50 ${
                  isPosted ? 'opacity-80 border-l-4 border-l-emerald-500' : ''
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-5 pb-4 border-b border-gray-200">
                  <div className="flex-1 pr-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight line-clamp-2">{idea.Idea || 'Untitled Idea'}</h2>
                    {idea.Timestamp && (
                      <p className="text-xs text-gray-500 font-medium">{formatDate(idea.Timestamp)}</p>
                    )}
                  </div>
                  {isPosted && (
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
                      ✓ Posted
                    </span>
                  )}
                </div>

                {/* Caption */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Caption
                  </label>
                  <textarea
                    readOnly
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm resize-none bg-gray-50 text-gray-900 focus:outline-none focus:border-purple-400 transition-colors"
                    rows={4}
                    value={idea.Caption || ''}
                    style={{ color: '#111827' }}
                  />
                </div>

                {/* Visual Description */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Visual Description
                  </label>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">{idea.Visual || 'N/A'}</p>
                </div>

                {/* Source */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Source
                  </label>
                  {idea.Source ? (
                    <a
                      href={idea.Source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 hover:underline break-all font-medium inline-block bg-purple-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      {idea.Source}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">N/A</p>
                  )}
                </div>

                {/* Image Link */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    Image Link <span className="text-purple-600">(Editable)</span>
                  </label>
                  <input
                    type="text"
                    value={imageLink}
                    onChange={(e) => updateImageLink(index, e.target.value)}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all bg-white"
                    placeholder="Enter image URL"
                    style={{ color: '#111827' }}
                  />
                  <div className="mt-3 w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex items-center justify-center shadow-inner border-2 border-gray-200">
                    {imageLink ? (
                      <img
                        src={imageLink}
                        alt="Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-gray-500 font-medium">Image failed to load</span>';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 font-medium">No image</span>
                    )}
                  </div>
                </div>

                {/* Post Button */}
                <button
                  onClick={() => postToInstagram(index)}
                  disabled={isPosted || postingIndex === index}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 ${
                    isPosted || postingIndex === index
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 hover:-translate-y-1 shadow-lg'
                  }`}
                >
                  {postingIndex === index ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Posting...
                    </span>
                  ) : isPosted ? (
                    '✓ Already Posted'
                  ) : (
                    '📤 Post to Instagram'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
