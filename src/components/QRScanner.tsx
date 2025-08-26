import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, QrCode } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulate QR code scanning for demo purposes
  const simulateScan = () => {
    setIsSimulating(true);
    setTimeout(() => {
      onScan("1234567890123"); // Mock barcode
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-white font-semibold">Scan QR Code</h2>
          <div className="w-10" />
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="relative">
          {/* Scanner Frame */}
          <div className="w-80 h-80 border-4 border-white/30 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-4 border-2 border-eco-primary rounded-xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-eco-primary rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-eco-primary rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-eco-primary rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-eco-primary rounded-br-lg"></div>
            </div>
            
            {/* Scanning Line Animation */}
            {isSimulating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-eco-primary to-transparent opacity-75 animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center mt-8">
            <QrCode className="h-12 w-12 text-white/60 mx-auto mb-4" />
            <p className="text-white/80 text-lg mb-2">Position QR code within the frame</p>
            <p className="text-white/60 text-sm mb-6">The code will be scanned automatically</p>
            
            {/* Demo Button */}
            <Button
              onClick={simulateScan}
              disabled={isSimulating}
              className="bg-eco-primary hover:bg-eco-primary/90 text-white font-semibold"
            >
              {isSimulating ? "Scanning..." : "Demo Scan"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
          <p className="text-white text-center text-sm">
            Ensure the QR code is clearly visible and well-lit for best results
          </p>
        </Card>
      </div>
    </div>
  );
};