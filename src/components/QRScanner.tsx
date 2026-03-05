import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        // @ts-ignore - The library supports this but types might be outdated or implicit
        formatsToSupport: [
          0, // QR_CODE
          1, // AZTEC
          2, // CODABAR
          3, // CODE_39
          4, // CODE_93
          5, // CODE_128
          6, // DATA_MATRIX
          7, // MAXICODE
          8, // ITF
          9, // EAN_13
          10, // EAN_8
          11, // PDF_417
          12, // RSS_14
          13, // RSS_EXPANDED
          14, // UPC_A
          15, // UPC_E
          16 // UPC_EAN_EXTENSION
        ]
      },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        // Stop scanning after success to prevent multiple triggers
        scanner.clear().catch(console.error);
      },
      (errorMessage) => {
        // Only log critical errors, ignore "QR code not found" noise
        if (!errorMessage.includes("No MultiFormat Readers")) {
          console.warn(errorMessage);
        }
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900">Escanejar Codi QR</h2>
          <p className="text-sm text-gray-500 mb-4">Apunta la càmera al codi del producte</p>
        </div>

        <div id="reader" className="w-full aspect-square bg-gray-100"></div>
        
        <div className="p-4 text-center text-xs text-gray-400">
          Si no funciona, prova d'introduir el codi manualment.
        </div>
      </div>
    </div>
  );
}
