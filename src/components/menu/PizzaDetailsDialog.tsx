
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PizzaItem } from '@/data/pizzaData';
import { useCart } from '@/context/CartContext';
import { ImageOff } from 'lucide-react';

interface PizzaDetailsDialogProps {
  pizza: PizzaItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const PizzaDetailsDialog: React.FC<PizzaDetailsDialogProps> = ({
  pizza,
  isOpen,
  onClose,
}) => {
  const { addToCart } = useCart();
  const [excludedIngredients, setExcludedIngredients] = React.useState<string[]>([]);
  const [imageError, setImageError] = React.useState(false);

  // Reset excluded ingredients when dialog opens with new pizza
  React.useEffect(() => {
    setExcludedIngredients([]);
    setImageError(false);
  }, [pizza]);

  if (!pizza) return null;

  // Extract ingredients from description
  const ingredients = pizza.description
    .split(',')
    .map(ingredient => ingredient.trim())
    .filter(ingredient => ingredient.toLowerCase() !== 'e orégano');

  const handleAddToCart = () => {
    const customizations = excludedIngredients.length > 0 
      ? { excludedIngredients } 
      : undefined;
    
    addToCart(pizza, customizations);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>{pizza.name}</DialogTitle>
          <DialogDescription>
            Personalize sua pizza
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <ImageOff className="h-12 w-12 text-gray-400" />
              </div>
            ) : (
              <img
                src={pizza.image}
                alt={pizza.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Ingredientes:</h4>
            <div className="space-y-2">
              {ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ingredient-${idx}`}
                    checked={!excludedIngredients.includes(ingredient)}
                    onCheckedChange={(checked) => {
                      setExcludedIngredients(prev => 
                        checked
                          ? prev.filter(i => i !== ingredient)
                          : [...prev, ingredient]
                      );
                    }}
                  />
                  <label
                    htmlFor={`ingredient-${idx}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {ingredient}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-lg font-bold text-pizza-500">
              R$ {pizza.price.toFixed(2)}
            </span>
            <Button onClick={handleAddToCart} className="bg-pizza-500 hover:bg-pizza-600">
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PizzaDetailsDialog;
