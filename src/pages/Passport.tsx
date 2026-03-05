import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Recycle, Wrench, Leaf, Factory, Calendar, Share2, QrCode, X, Cpu, ThumbsUp, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { products, Product } from '../data/products';
import AIAssistant from '../components/AIAssistant';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import { GoogleGenAI } from "@google/genai";

export default function Passport() {
  const { id: paramId } = useParams();
  const id = decodeURIComponent(paramId || '');
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const isImage = id.startsWith('img-');
    const isUrl = /^(http|https|www\.)/i.test(id);

    // 1. Try static products (skip if it's an image or URL that needs analysis)
    let found = undefined;
    
    if (!isImage && !isUrl) {
      found = products.find(p => p.id === id);
      
      // 2. Try dynamic products (localStorage)
      if (!found) {
        const dynamicProducts = JSON.parse(localStorage.getItem('dynamicProducts') || '[]');
        found = dynamicProducts.find((p: Product) => p.id === id);
      }
    }

    if (found) {
      setProduct(found);
      addToHistory(found);
    } else {
      // 3. Not found locally, or forced analysis (Image/URL), generate with AI
      generateProduct(id);
    }
  }, [id]);

  const addToHistory = (prod: Product) => {
    const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    const newEntry = {
      id: prod.id,
      name: prod.name,
      manufacturer: prod.manufacturer,
      category: prod.category,
      timestamp: Date.now()
    };
    
    const filteredHistory = history.filter((h: any) => h.id !== prod.id);
    const newHistory = [newEntry, ...filteredHistory].slice(0, 10);
    
    localStorage.setItem('scanHistory', JSON.stringify(newHistory));
  };

  const generateProduct = async (identifier: string) => {
    setIsGenerating(true);
    setGenerationError(false);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY });
      
      const isUrl = /^(http|https|www\.)/i.test(identifier.trim());
      const isImage = identifier.startsWith('img-');
      
      let urlToAnalyze = identifier.trim();
      if (isUrl && !/^https?:\/\//i.test(urlToAnalyze)) {
        urlToAnalyze = 'https://' + urlToAnalyze;
      }
      
      let prompt = `
        The user scanned a QR code or provided an ID: "${identifier}".
        
        Task: Analyze this product and provide its details in JSON format.
        
        The JSON must strictly match this TypeScript interface:
        interface Product {
          id: string; // Use the provided identifier
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
            score: number; // 1-10
            text: string; // Recommendation text
          };
        }

        Return ONLY the JSON object. No markdown.
      `;

      const config: any = {
        // responseMimeType: "application/json" // Removed to avoid conflicts with tools
      };

      let contents: any = prompt;

      if (isUrl) {
        // Use URL Context + Google Search to analyze the URL content
        config.tools = [{ googleSearch: {} }, { urlContext: {} }];
        prompt = `
          The user provided this URL: ${urlToAnalyze}
          
          Task: Access this URL, analyze the product page content, and extract the product details.
          
          1. READ the content of the provided URL (${urlToAnalyze}) using the urlContext tool.
          2. If the URL is a redirect or short link, follow it to the final product page.
          3. Extract REAL data from the page: Name, Manufacturer, Category, Specs, Materials, Sustainability info.
          4. If specific sustainability data (carbon footprint, repairability) is missing on the page, ESTIMATE it based on the product type and industry standards, but prioritize real data found on the page or via Google Search.
          5. Return the JSON matching the interface.
          
          ${prompt}
        `;
        contents = prompt;
      } else if (isImage) {
        // Handle Image Analysis
        const storageKey = `captured_image_${identifier}`;
        const base64Image = localStorage.getItem(storageKey);
        
        if (!base64Image) {
          throw new Error("Image data not found");
        }

        // Clean up base64 string if it has prefix
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        prompt = `
          Analyze this image of a product.
          
          Task: Visually identify the product (Name, Manufacturer, Model) and determine its characteristics.
          
          1. Identify the product visually. If the exact model is not clear, infer the most likely model or a generic model for this type of product (e.g., "HP Laptop" instead of a specific serial number).
          2. Determine its specifications, materials, and sustainability metrics based on the identified product type.
          3. Return the JSON matching the interface provided below.
          
          IMPORTANT: Do NOT return an error if you cannot identify the exact serial number. Provide the best possible identification based on visual appearance.
          
          The JSON must strictly match this TypeScript interface:
          interface Product {
            id: string; // Use "${identifier}" as the ID
            name: string;
            manufacturer: string;
            manufactureDate: string; // YYYY-MM-DD
            category: string; // e.g. Electrònica, Mobiliari, Roba, etc.
            materials: { name: string; percentage: number; recyclable: boolean }[];
            repairabilityScore: number; // 1-10
            carbonFootprint: string; // e.g. "45kg CO2e"
            description: string;
            imageUrl: string; // Use the image provided if possible, otherwise https://picsum.photos/seed/${identifier}/400/400
            maintenanceGuide: string;
            technicalSpecs: string[]; // List of 4-6 key technical specifications
            recommendation: {
              score: number; // 1-10
              text: string; // Recommendation text
            };
          }

          Return ONLY the JSON object. No markdown.
        `;

        contents = {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64
              }
            },
            { text: prompt }
          ]
        };
        
        // We can also use Google Search to help with identification if needed, 
        // but let's start with pure vision to avoid tool conflicts with image input in some models
        // config.tools = [{ googleSearch: {} }]; 
      } else {
        // If it's not a URL, it might be a barcode (UPC/EAN) or a model name
        // Use Google Search to find the product by this identifier
        config.tools = [{ googleSearch: {} }];
        prompt = `
          First, use Google Search to identify the product with this ID/Barcode/Name: "${identifier}"
          
          Then, based on the search results, extract the product details in JSON format.
          
          ${prompt}
        `;
        contents = prompt;
      }

      let textResponse = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: contents,
          config: config
        });
        textResponse = response.text || "";
      } catch (primaryError) {
        console.warn("Primary generation failed, retrying with fallback model...", primaryError);
        // Fallback to Flash model if Pro fails
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: contents,
          config: config
        });
        textResponse = fallbackResponse.text || "";
      }

      // Clean up the response to extract JSON
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : "{}";
      const newProduct = JSON.parse(jsonString);
      
      if (newProduct.id) {
        // Ensure ID matches what we looked for (or use the one provided if it's cleaner)
        // If the AI generated a new ID, we might want to map the scanned ID to this new product
        // But for simplicity, let's trust the AI or force the ID to match the scan if it's not a URL
        // Actually, let's just save it.
        
        // If the identifier was a URL, the AI might have used it as ID.
        
        const currentDynamic = JSON.parse(localStorage.getItem('dynamicProducts') || '[]');
        localStorage.setItem('dynamicProducts', JSON.stringify([...currentDynamic, newProduct]));
        
        // Clean up image data if it was an image scan to save space
        if (identifier.startsWith('img-')) {
          localStorage.removeItem(`captured_image_${identifier}`);
        }
        
        setProduct(newProduct);
        addToHistory(newProduct);
      } else {
        setGenerationError(true);
      }
    } catch (e) {
      console.error("Generation failed", e);
      setGenerationError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    const isUrl = /^(http|https|www\.)/i.test(id.trim());
    const isImage = id.startsWith('img-');
    let previewImage = null;
    
    if (isImage) {
      const storageKey = `captured_image_${id}`;
      previewImage = localStorage.getItem(storageKey);
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        {previewImage ? (
          <div className="w-32 h-32 mb-6 rounded-2xl overflow-hidden border-4 border-white shadow-lg relative">
            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>
          </div>
        ) : (
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-pulse">
            <Sparkles size={32} />
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isUrl ? "Analitzant Enllaç..." : isImage ? "Analitzant Imatge..." : "Cercant a la Web..."}
        </h2>
        <p className="text-gray-500 max-w-xs mx-auto mb-8">
          {isUrl 
            ? "Estem llegint el contingut de l'enllaç i analitzant les especificacions tècniques amb IA avançada."
            : isImage
            ? "Estem analitzant la foto per identificar el producte i extreure'n les dades."
            : "Estem cercant informació d'aquest producte a internet per obtenir-ne els detalls."}
        </p>
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <Loader2 size={16} className="animate-spin" />
          Processant dades amb IA
        </div>
      </div>
    );
  }

  if (!product || generationError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
          <Recycle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Producte no trobat</h2>
        <p className="text-gray-500 mb-6 max-w-xs mx-auto">No hem pogut identificar el producte. Potser la imatge no és clara o el producte no és reconeixible.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => generateProduct(id)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Tornar-ho a provar
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Tornar a l'inici
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-20"
    >
      {/* Header Image */}
      <div className="relative h-64 bg-gray-100">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <button 
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={() => setShowQR(true)}
            className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors"
          >
            <QrCode size={20} />
          </button>
          <button 
            className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <span className="px-2 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-md text-xs font-medium uppercase tracking-wider mb-2 inline-block">
            {product.category}
          </span>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-8">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Wrench size={18} />
              </div>
              <div className="text-lg font-bold text-gray-900">{product.repairabilityScore}/10</div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400">Reparabilitat</div>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-10 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <Leaf size={18} />
              </div>
              <div className="text-lg font-bold text-gray-900">{product.carbonFootprint}</div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400">Petjada CO2</div>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-10 mx-auto bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                <Recycle size={18} />
              </div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(product.materials.reduce((acc, m) => m.recyclable ? acc + m.percentage : acc, 0))}%
              </div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400">Reciclable</div>
            </div>
          </div>

          {/* AI Assistant Section */}
          <AIAssistant product={product} />

          {/* Recommendation Section */}
          {product.recommendation && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ThumbsUp size={18} className="text-gray-400" />
                Recomanació de Compra
              </h3>
              <div className={`p-5 rounded-2xl border ${product.recommendation.score >= 8 ? 'bg-emerald-50 border-emerald-100' : product.recommendation.score >= 5 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`text-2xl font-bold ${product.recommendation.score >= 8 ? 'text-emerald-600' : product.recommendation.score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {product.recommendation.score}/10
                  </div>
                  <div className={`text-sm font-medium px-2 py-1 rounded-full ${product.recommendation.score >= 8 ? 'bg-emerald-100 text-emerald-700' : product.recommendation.score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {product.recommendation.score >= 9 ? 'Molt Recomanable' : product.recommendation.score >= 7 ? 'Recomanable' : 'Poc Recomanable'}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.recommendation.text}
                </p>
              </div>
            </div>
          )}

          {/* Technical Specs */}
          {product.technicalSpecs && product.technicalSpecs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Cpu size={18} className="text-gray-400" />
                Característiques Tècniques
              </h3>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {product.technicalSpecs.map((spec, idx) => (
                  <div key={idx} className="px-4 py-3 border-b border-gray-50 last:border-0 text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                    {spec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Factory size={18} className="text-gray-400" />
              Origen i Fabricació
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Fabricant</span>
                <span className="font-medium text-gray-900">{product.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Data Fabricació</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <Calendar size={14} />
                  {product.manufactureDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Núm. Sèrie</span>
                <span className="font-mono text-gray-900">{product.id}</span>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Recycle size={18} className="text-gray-400" />
              Composició de Materials
            </h3>
            <div className="space-y-3">
              {product.materials.map((material, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{material.name}</span>
                    <span className="font-medium text-gray-900">{material.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${material.recyclable ? 'bg-emerald-400' : 'bg-orange-400'}`} 
                      style={{ width: `${material.percentage}%` }}
                    ></div>
                  </div>
                  {!material.recyclable && (
                    <p className="text-[10px] text-orange-500">No reciclable - consultar punt verd</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wrench size={18} className="text-gray-400" />
              Guia de Manteniment
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              {product.maintenanceGuide}
            </p>
          </div>

          {/* Digital Label Section */}
          <div className="bg-emerald-900 rounded-2xl p-6 text-white text-center space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <QrCode size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Etiqueta per a Futurs Usuaris</h3>
              <p className="text-emerald-200 text-sm">Genera un codi QR perquè altres persones puguin escanejar i accedir a aquesta fitxa.</p>
            </div>
            <button 
              onClick={() => setShowQR(true)}
              className="w-full py-3 bg-white text-emerald-900 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
            >
              Generar Etiqueta QR
            </button>
          </div>

        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-500 text-sm mb-6">Escaneja aquest codi per accedir a la informació del producte</p>
              
              <div className="bg-white p-4 rounded-xl border-2 border-emerald-100 inline-block">
                <QRCode value={product.id} size={200} />
              </div>
              
              <p className="mt-6 font-mono text-xs text-gray-400">{product.id}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
