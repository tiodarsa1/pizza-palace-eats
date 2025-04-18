
import React from 'react';
import CategoryCard from './CategoryCard';

const Categories = () => {
  const categories = [
    {
      id: 1,
      title: 'Pizzas Tradicionais',
      image: 'https://img.freepik.com/premium-photo/delicious-classic-italian-pizza-margherita-with-mozzarella-fresh-basil_79782-2425.jpg',
      link: '/menu?category=tradicionais'
    },
    {
      id: 2,
      title: 'Pizzas Premium',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8MXx8fGVufDB8fHx8fA%3D%3D',
      link: '/menu?category=premium'
    },
    {
      id: 3,
      title: 'Pizzas Doces',
      image: 'https://insanelygoodrecipes.com/wp-content/uploads/2020/08/Delicious-Dessert-Pizza-with-Nutella.jpg',
      link: '/menu?category=doces'
    },
    {
      id: 4,
      title: 'Bebidas',
      image: 'https://plus.unsplash.com/premium_photo-1671394138498-aac1dfcf8aa1?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c29mdCUyMGRyaW5rc3xlbnwwfHwwfHx8MA%3D%3D',
      link: '/menu?category=bebidas'
    },
  ];

  return (
    <section className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Navegue por Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              image={category.image}
              link={category.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
