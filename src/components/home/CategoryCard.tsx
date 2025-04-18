
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  image: string;
  link: string;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, image, link, className }) => {
  return (
    <Link to={link} className={cn("block", className)}>
      <div className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
        <div className="aspect-square overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
