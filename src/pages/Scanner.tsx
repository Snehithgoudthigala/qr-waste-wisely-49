import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Scan, History, Leaf, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { QRScanner } from "@/components/QRScanner";
import { ProductResult } from "@/components/ProductResult";
import { useToast } from "@/hooks/use-toast";

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const { toast } = useToast();
  const { signOut, user } = useAuth();

  const handleScan = (data: string) => {
    // Simulate product recognition
    const mockProduct = {
      name: "Plastic Water Bottle",
      barcode: data,
      category: "Recyclable Plastic",
      wasteType: "recyclable",
      instructions: "Remove cap and label, rinse clean, and place in recycling bin.",
      environmentalImpact: "Can be recycled into new bottles or clothing fibers.",
      color: "blue"
    };

    setScannedData(mockProduct);
    setIsScanning(false);
    
    toast({
      title: "Product Recognized!",
      description: `${mockProduct.name} - ${mockProduct.category}`,
    });
  };

  const startScanning = () => {
    setIsScanning(true);
    setScannedData(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  if (scannedData) {
    return <ProductResult product={scannedData} onScanAnother={() => setScannedData(null)} />;
  }

  if (isScanning) {
    return <QRScanner onScan={handleScan} onClose={() => setIsScanning(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-eco-accent/5 to-eco-secondary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-eco-primary to-eco-secondary p-3 rounded-full shadow-lg">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Waste Wise</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email?.split('@')[0]}! Smart waste segregation through QR scanning
          </p>
        </div>

        {/* Main Scanner Card */}
        <Card className="p-8 mb-6 shadow-xl border-eco-primary/20">
          <div className="text-center">
            <div className="bg-eco-accent/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <QrCode className="h-12 w-12 text-eco-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Scan Product QR Code</h2>
            <p className="text-muted-foreground mb-8">
              Point your camera at a product's QR code to get recycling and disposal guidance
            </p>
            <Button 
              onClick={startScanning}
              size="lg"
              className="bg-gradient-to-r from-eco-primary to-eco-secondary hover:from-eco-primary/90 hover:to-eco-secondary/90 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <Scan className="mr-2 h-5 w-5" />
              Start Scanning
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-eco-secondary/20">
            <div className="flex items-center">
              <div className="bg-eco-secondary/20 p-3 rounded-lg mr-4">
                <History className="h-6 w-6 text-eco-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Scan History</h3>
                <p className="text-sm text-muted-foreground">View your previous scans</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-eco-success/20">
            <div className="flex items-center">
              <div className="bg-eco-success/20 p-3 rounded-lg mr-4">
                <Leaf className="h-6 w-6 text-eco-success" />
              </div>
              <div>
                <h3 className="font-semibold">Eco Impact</h3>
                <p className="text-sm text-muted-foreground">Track your environmental impact</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Scanner;