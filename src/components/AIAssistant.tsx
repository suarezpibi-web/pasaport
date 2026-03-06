import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Product } from '../data/products';

interface AIAssistantProps {
  product: Product;
}

export default function AIAssistant({ product }: AIAssistantProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const getApiKey = () => {
        try {
          return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyAf8j8enDaVa6YJjQhSvhznYoqLAC0X6Wk";
        } catch (e) {
          return "AIzaSyAf8j8enDaVa6YJjQhSvhznYoqLAC0X6Wk";
        }
      };
      
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview"; // Using a fast model for quick responses

      const prompt = `
        Ets un expert en economia circular i reparació de productes.
        Estàs analitzant el següent producte:
        Nom: ${product.name}
        Fabricant: ${product.manufacturer}
        Materials: ${product.materials.map(m => `${m.name} (${m.percentage}%)`).join(', ')}
        Guia de manteniment: ${product.maintenanceGuide}

        L'usuari pregunta: "${query}"

        Respon de manera concisa, pràctica i útil en català. Si la pregunta és sobre reciclatge o reparació, dona passos específics basats en els materials.
      `;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      setResponse(result.text || "No he pogut generar una resposta. Torna-ho a provar.");
    } catch (error) {
      console.error("Error AI:", error);
      setResponse("Hi ha hagut un error connectant amb l'assistent IA. Si us plau, verifica la teva clau API o torna-ho a provar més tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <Sparkles size={20} />
        </div>
        <h3 className="font-semibold text-emerald-900">Assistent IA Eco-Reboot</h3>
      </div>

      <div className="space-y-4">
        {!response && !loading && (
          <div className="text-sm text-emerald-700/80 bg-white/50 p-3 rounded-xl">
            Pregunta'm sobre com reparar, reciclar o mantenir aquest producte.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 text-emerald-600">
            <Loader2 className="animate-spin mr-2" />
            <span className="text-sm font-medium">Analitzant producte...</span>
          </div>
        )}

        {response && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 text-emerald-900 text-sm leading-relaxed whitespace-pre-wrap">
            {response}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Ex: Com puc canviar la bateria?"
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white"
          />
          <button
            onClick={handleAskAI}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
