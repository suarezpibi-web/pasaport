import { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (decodedText: string) => void; // Keeping the prop name for compatibility, but it will return an image ID or data
  onClose: () => void;
  onCapture?: (imageData: string) => void;
}

export default function QRScanner({ onScan, onClose, onCapture }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No s'ha pogut accedir a la càmera. Si us plau, permet l'accés.");
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [facingMode]);

  // QR Scanning Loop
  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const scanQR = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = scanCanvasRef.current;
        
        if (canvas) {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (context) {
            // Limit scan resolution for performance
            const maxScanDim = 640;
            let scanWidth = video.videoWidth;
            let scanHeight = video.videoHeight;
            
            if (scanWidth > maxScanDim || scanHeight > maxScanDim) {
              if (scanWidth > scanHeight) {
                scanHeight = (scanHeight / scanWidth) * maxScanDim;
                scanWidth = maxScanDim;
              } else {
                scanWidth = (scanWidth / scanHeight) * maxScanDim;
                scanHeight = maxScanDim;
              }
            }

            canvas.width = scanWidth;
            canvas.height = scanHeight;
            context.drawImage(video, 0, 0, scanWidth, scanHeight);
            
            const imageData = context.getImageData(0, 0, scanWidth, scanHeight);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code) {
              // Found a QR code!
              if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
              
              // Play a beep sound (optional, but good feedback)
              // const audio = new Audio('/beep.mp3'); audio.play().catch(e => {});

              onScan(code.data);
            }
          }
        }
      }
    };

    scanIntervalRef.current = setInterval(scanQR, 500); // Scan every 500ms

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [stream, onScan]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video, but max 1024px
      const maxDim = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        const imageData = canvas.toDataURL('image/jpeg', 0.7); // Slightly lower quality to save space
        
        if (onCapture) {
          onCapture(imageData);
        } else {
          // Fallback for existing onScan prop if onCapture isn't provided
          // We'll pass a special prefix to indicate it's an image
          onScan(`image:${imageData}`);
        }
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
      >
        <X size={24} />
      </button>
      
      <div className="w-full h-full relative flex flex-col">
        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
          {error ? (
            <div className="text-white text-center p-4">
              <p className="mb-4">{error}</p>
              <button 
                onClick={() => startCamera()}
                className="px-4 py-2 bg-white text-black rounded-full"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={scanCanvasRef} className="hidden" />
          
          {/* Overlay guide */}
          <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-8 rounded-3xl">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
          </div>
          
          <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/80 text-sm bg-black/40 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
              Escaneja un codi QR o fes una foto al producte
            </p>
          </div>
        </div>

        <div className="h-32 bg-black flex items-center justify-around px-8 pb-8 pt-4">
          <button 
            onClick={toggleCamera}
            className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <RefreshCw size={24} />
          </button>
          
          <button 
            onClick={handleCapture}
            className="p-1 rounded-full border-4 border-white transition-transform active:scale-95"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Camera className="text-black" size={32} />
            </div>
          </button>
          
          <div className="w-12"></div> {/* Spacer for balance */}
        </div>
      </div>
    </div>
  );
}
