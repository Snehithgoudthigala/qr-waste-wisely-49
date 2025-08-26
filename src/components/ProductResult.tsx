import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Recycle, AlertTriangle, Leaf, Info } from "lucide-react";

interface Product {
  name: string;
  barcode: string;
  category: string;
  wasteType: string;
  instructions: string;
  environmentalImpact: string;
  color: string;
}

interface ProductResultProps {
  product: Product;
  onScanAnother: () => void;
}

export const ProductResult = ({ product, onScanAnother }: ProductResultProps) => {
  const getWasteIcon = (type: string) => {
    switch (type) {
      case "recyclable":
        return <Recycle className="h-6 w-6" />;
      case "hazardous":
        return <AlertTriangle className="h-6 w-6" />;
      case "compostable":
        return <Leaf className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  const getWasteColor = (type: string) => {
    switch (type) {
      case "recyclable":
        return "bg-eco-primary text-white";
      case "hazardous":
        return "bg-eco-warning text-white";
      case "compostable":
        return "bg-eco-success text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-eco-accent/5 to-eco-secondary/10">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onScanAnother}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Product Analysis</h1>
        </div>

        {/* Product Info Card */}
        <Card className="p-6 mb-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
              <p className="text-muted-foreground">Barcode: {product.barcode}</p>
            </div>
            <Badge className={`${getWasteColor(product.wasteType)} px-3 py-1`}>
              {getWasteIcon(product.wasteType)}
              <span className="ml-2">{product.category}</span>
            </Badge>
          </div>
        </Card>

        {/* Disposal Instructions */}
        <Card className="p-6 mb-6 border-eco-primary/20">
          <div className="flex items-center mb-4">
            <div className="bg-eco-primary/20 p-2 rounded-lg mr-3">
              <Recycle className="h-5 w-5 text-eco-primary" />
            </div>
            <h3 className="text-xl font-semibold">Disposal Instructions</h3>
          </div>
          <p className="text-foreground leading-relaxed">{product.instructions}</p>
        </Card>

        {/* Environmental Impact */}
        <Card className="p-6 mb-6 border-eco-success/20">
          <div className="flex items-center mb-4">
            <div className="bg-eco-success/20 p-2 rounded-lg mr-3">
              <Leaf className="h-5 w-5 text-eco-success" />
            </div>
            <h3 className="text-xl font-semibold">Environmental Impact</h3>
          </div>
          <p className="text-foreground leading-relaxed">{product.environmentalImpact}</p>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onScanAnother}
            className="w-full bg-gradient-to-r from-eco-primary to-eco-secondary hover:from-eco-primary/90 hover:to-eco-secondary/90 text-white font-semibold py-3 rounded-xl"
            size="lg"
          >
            Scan Another Product
          </Button>
          <Button 
            variant="outline"
            className="w-full border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
            size="lg"
          >
            Save to History
          </Button>
        </div>
      </div>
    </div>
  );
};