import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Smartphone, Armchair, Shirt, Clock, Trash2, History, X, Sparkles, Loader2 } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { products, Product } from '../data/products';
import { GoogleGenAI } from "@google/genai";

export default function Home() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchSerial, setSearchSerial] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('scanHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmClear) {
      localStorage.removeItem('scanHistory');
      setHistory([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('scanHistory', JSON.stringify(newHistory));
  };

  const handleScan = (decodedText: string) => {
    setShowScanner(false);
    navigate(`/passport/${encodeURIComponent(decodedText)}`);
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nameQuery = searchName.trim();
    const serialQuery = searchSerial.trim();

    if (!nameQuery && !serialQuery) return;

    setIsSearching(true);
    setSearchResults([]);
    setHasSearched(false);

    try {
      // 1. Exact local match (fastest)
      const exactMatch = products.find(p => 
        (serialQuery && p.id.toLowerCase() === serialQuery.toLowerCase()) ||
        (nameQuery && p.name.toLowerCase() === nameQuery.toLowerCase())
      );

      if (exactMatch) {
        navigate(`/passport/${exactMatch.id}`);
        return;
      }

      // 2. AI Semantic Search
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Create a lightweight index for the AI
      const productIndex = products.map(p => ({
        id: p.id,
        text: `${p.name} ${p.manufacturer} ${p.category} ${p.description} ${p.id}`
      }));

      const prompt = `
        I have a list of products with these details:
        ${JSON.stringify(productIndex)}

        The user is searching for:
        "${nameQuery} ${serialQuery}"

        Return a JSON object with a property "matchedIds" containing an array of product IDs that match the user's intent.
        Be flexible with typos and semantic meaning (e.g. "mobile" matches "phone", "chair" matches "seat").
        If nothing matches, return an empty array.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
      const matchedIds = result.matchedIds || [];

      const results = products.filter(p => matchedIds.includes(p.id));
      
      if (results.length > 0) {
        setSearchResults(results);
        setHasSearched(true);
      } else {
        // 3. If no local match, generate a new product with AI
        await generateAndRedirect(nameQuery, serialQuery);
      }

    } catch (error) {
      console.error("Search failed:", error);
      // Fallback to basic filter if AI fails
      const fallbackResults = products.filter(p => 
        (nameQuery && p.name.toLowerCase().includes(nameQuery.toLowerCase())) ||
        (serialQuery && p.id.toLowerCase().includes(serialQuery.toLowerCase()))
      );
      
      if (fallbackResults.length > 0) {
        setSearchResults(fallbackResults);
        setHasSearched(true);
      } else {
        // Even fallback failed, try to generate
        await generateAndRedirect(nameQuery, serialQuery);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const generateAndRedirect = async (name: string, serial: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Generate a realistic product passport JSON for a product with:
        Name/Model: "${name}"
        Serial Number: "${serial || 'UNKNOWN-' + Math.floor(Math.random()*10000)}"

        The JSON must strictly match this TypeScript interface:
        interface Product {
          id: string; // Use the provided serial number or generate a realistic one
          name: string;
          manufacturer: string;
          manufactureDate: string; // YYYY-MM-DD
          category: string; // e.g. Electrònica, Mobiliari, Roba, etc.
          materials: { name: string; percentage: number; recyclable: boolean }[];
          repairabilityScore: number; // 1-10
          carbonFootprint: string; // e.g. "45kg CO2e"
          description: string;
          imageUrl: string; // Use https://picsum.photos/seed/{seed}/400/400
          maintenanceGuide: string;
          technicalSpecs: string[]; // List of 4-6 key technical specifications
          recommendation: {
            score: number; // 1-10, how recommended it is to buy
            text: string; // A short paragraph explaining why it is or isn't recommended based on sustainability and specs
          };
        }

        Return ONLY the JSON object. No markdown formatting.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const newProduct = JSON.parse(response.text || "{}");
      
      if (newProduct.id) {
        // Save to dynamic storage
        const currentDynamic = JSON.parse(localStorage.getItem('dynamicProducts') || '[]');
        localStorage.setItem('dynamicProducts', JSON.stringify([...currentDynamic, newProduct]));
        
        // Navigate immediately
        navigate(`/passport/${newProduct.id}`);
      } else {
        setSearchResults([]);
        setHasSearched(true);
      }
    } catch (e) {
      console.error("Generation failed", e);
      setSearchResults([]);
      setHasSearched(true);
    }
  };

  const clearSearch = () => {
    setSearchName('');
    setSearchSerial('');
    setHasSearched(false);
    setSearchResults([]);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-emerald-900">Eco-Reboot</h1>
        <p className="text-emerald-600/80">Escaneja per descobrir la vida del teu producte</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setShowScanner(true)}
            className="w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 hover:bg-emerald-200 hover:scale-105 transition-all shadow-inner"
          >
            <QrCode size={40} />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">Escanejar Codi QR</h2>
            <p className="text-sm text-gray-500 mt-1">Apunta la càmera al codi del producte</p>
          </div>
        </div>

        <div className="relative flex py-6 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink-0 mx-4 text-gray-300 text-xs uppercase tracking-wider">Cerca Manual</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-3 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Model o Marca (ex: EcoPhone)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm"
            />
            {searchName && (
              <button 
                type="button"
                onClick={() => setSearchName('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Núm. Sèrie (ex: SN-GT-24...)"
              value={searchSerial}
              onChange={(e) => setSearchSerial(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm"
            />
            {searchSerial && (
              <button 
                type="button"
                onClick={() => setSearchSerial('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between pl-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Search size={16} />
              Resultats de la cerca ({searchResults.length})
            </h3>
            <button 
              onClick={clearSearch}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Netejar
            </button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-500">No s'han trobat productes.</p>
              <p className="text-xs text-gray-400 mt-1">Prova amb un altre nom o número de sèrie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/passport/${product.id}`)}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100 ring-2 ring-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    {product.category === 'Electrònica' && <Smartphone size={20} />}
                    {product.category === 'Mobiliari' && <Armchair size={20} />}
                    {product.category === 'Roba' && <Shirt size={20} />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">{product.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-600">{product.manufacturer}</span>
                      <span>•</span>
                      <span className="font-mono">{product.id}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Section (Hidden when searching) */}
      {!hasSearched && history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <History size={16} />
              Historial Recent
            </h3>
            <button 
              onClick={clearHistory}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${confirmClear ? 'bg-red-100 text-red-700 font-bold' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
            >
              <Trash2 size={12} />
              {confirmClear ? 'Confirmar?' : 'Esborrar Tot'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {history.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => navigate(`/passport/${item.id}`)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-left relative overflow-hidden pr-12"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                    {item.category === 'Electrònica' && <Smartphone size={20} />}
                    {item.category === 'Mobiliari' && <Armchair size={20} />}
                    {item.category === 'Roba' && <Shirt size={20} />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900 truncate pr-2">{item.name}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-600 truncate">{item.manufacturer}</span>
                      <span>•</span>
                      <span className="font-mono truncate">{item.id}</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => deleteHistoryItem(e, item.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-10"
                  title="Esborrar"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Products (only show if history is empty or short, and not searching) */}
      {!hasSearched && history.length === 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider pl-2">Productes de Mostra</h3>
          <div className="grid grid-cols-1 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => navigate(`/passport/${product.id}`)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-left group opacity-75 hover:opacity-100"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  {product.category === 'Electrònica' && <Smartphone size={20} />}
                  {product.category === 'Mobiliari' && <Armchair size={20} />}
                  {product.category === 'Roba' && <Shirt size={20} />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">{product.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-600">{product.manufacturer}</span>
                    <span>•</span>
                    <span className="font-mono">{product.id}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showScanner && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}
