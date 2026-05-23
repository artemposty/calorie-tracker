import { FoodItem } from './types';

export const FOOD_DB: FoodItem[] = [
  // Мясо / Птица
  { name: 'Куриная грудка (варёная)', kcal: 165, p: 31, f: 3.6, c: 0, category: 'Мясо и птица' },
  { name: 'Куриное бедро (без кожи)', kcal: 177, p: 25, f: 8.2, c: 0, category: 'Мясо и птица' },
  { name: 'Индейка, грудка', kcal: 157, p: 30, f: 3.2, c: 0, category: 'Мясо и птица' },
  { name: 'Говядина, вырезка', kcal: 172, p: 26, f: 7, c: 0, category: 'Мясо и птица' },
  { name: 'Свинина, лопатка', kcal: 215, p: 20, f: 14.6, c: 0, category: 'Мясо и птица' },
  { name: 'Фарш куриный', kcal: 143, p: 17, f: 8, c: 0, category: 'Мясо и птица' },
  { name: 'Фарш говяжий (5% жира)', kcal: 152, p: 21, f: 7, c: 0, category: 'Мясо и птица' },

  // Рыба
  { name: 'Лосось / Сёмга', kcal: 208, p: 20, f: 13, c: 0, category: 'Рыба' },
  { name: 'Тунец (консервы в воде)', kcal: 116, p: 26, f: 0.6, c: 0, category: 'Рыба' },
  { name: 'Треска', kcal: 82, p: 18, f: 0.7, c: 0, category: 'Рыба' },
  { name: 'Тилапия', kcal: 96, p: 20, f: 1.7, c: 0, category: 'Рыба' },
  { name: 'Скумбрия', kcal: 205, p: 19, f: 14, c: 0, category: 'Рыба' },

  // Яйца
  { name: 'Яйцо целое', kcal: 155, p: 13, f: 11, c: 1.1, category: 'Яйца и молочное' },
  { name: 'Яичный белок', kcal: 52, p: 11, f: 0.2, c: 0.7, category: 'Яйца и молочное' },

  // Молочное
  { name: 'Творог 0%', kcal: 79, p: 18, f: 0.5, c: 1.8, category: 'Яйца и молочное' },
  { name: 'Творог 5%', kcal: 121, p: 17, f: 5, c: 1.8, category: 'Яйца и молочное' },
  { name: 'Греческий йогурт 0%', kcal: 59, p: 10, f: 0.4, c: 3.6, category: 'Яйца и молочное' },
  { name: 'Молоко 2.5%', kcal: 52, p: 2.9, f: 2.5, c: 4.7, category: 'Яйца и молочное' },
  { name: 'Кефир 1%', kcal: 40, p: 3.4, f: 1, c: 4.7, category: 'Яйца и молочное' },
  { name: 'Сыр российский', kcal: 363, p: 24, f: 29, c: 0, category: 'Яйца и молочное' },
  { name: 'Сыр пармезан', kcal: 431, p: 38, f: 29, c: 4, category: 'Яйца и молочное' },
  { name: 'Протеиновый коктейль (сывороточный)', kcal: 371, p: 80, f: 4, c: 5, category: 'Яйца и молочное' },

  // Крупы и гарниры
  { name: 'Рис белый (варёный)', kcal: 130, p: 2.7, f: 0.3, c: 28, category: 'Крупы и гарниры' },
  { name: 'Рис бурый (варёный)', kcal: 123, p: 2.6, f: 0.9, c: 26, category: 'Крупы и гарниры' },
  { name: 'Гречка (варёная)', kcal: 92, p: 3.4, f: 0.6, c: 20, category: 'Крупы и гарниры' },
  { name: 'Овсянка (варёная)', kcal: 71, p: 2.5, f: 1.5, c: 12, category: 'Крупы и гарниры' },
  { name: 'Овсяные хлопья (сухие)', kcal: 389, p: 17, f: 7, c: 66, category: 'Крупы и гарниры' },
  { name: 'Макароны (варёные)', kcal: 131, p: 5, f: 1.1, c: 25, category: 'Крупы и гарниры' },
  { name: 'Картофель (варёный)', kcal: 86, p: 1.7, f: 0.1, c: 20, category: 'Крупы и гарниры' },
  { name: 'Хлеб ржаной', kcal: 259, p: 9, f: 3.3, c: 48, category: 'Крупы и гарниры' },
  { name: 'Хлеб цельнозерновой', kcal: 247, p: 13, f: 3.5, c: 43, category: 'Крупы и гарниры' },

  // Бобовые
  { name: 'Чечевица (варёная)', kcal: 116, p: 9, f: 0.4, c: 20, category: 'Бобовые' },
  { name: 'Фасоль (варёная)', kcal: 127, p: 9, f: 0.5, c: 23, category: 'Бобовые' },
  { name: 'Нут (варёный)', kcal: 164, p: 9, f: 2.6, c: 27, category: 'Бобовые' },
  { name: 'Соевый тофу', kcal: 76, p: 8, f: 4.6, c: 1.9, category: 'Бобовые' },

  // Овощи
  { name: 'Брокколи', kcal: 34, p: 2.8, f: 0.4, c: 7, category: 'Овощи' },
  { name: 'Помидор', kcal: 18, p: 0.9, f: 0.2, c: 3.9, category: 'Овощи' },
  { name: 'Огурец', kcal: 15, p: 0.7, f: 0.1, c: 3.6, category: 'Овощи' },
  { name: 'Перец болгарский', kcal: 31, p: 1, f: 0.3, c: 6, category: 'Овощи' },
  { name: 'Шпинат', kcal: 23, p: 2.9, f: 0.4, c: 3.6, category: 'Овощи' },
  { name: 'Цветная капуста', kcal: 25, p: 1.9, f: 0.3, c: 5, category: 'Овощи' },
  { name: 'Морковь', kcal: 41, p: 0.9, f: 0.2, c: 10, category: 'Овощи' },
  { name: 'Белокочанная капуста', kcal: 25, p: 1.3, f: 0.1, c: 5.8, category: 'Овощи' },

  // Фрукты
  { name: 'Банан', kcal: 89, p: 1.1, f: 0.3, c: 23, category: 'Фрукты' },
  { name: 'Яблоко', kcal: 52, p: 0.3, f: 0.2, c: 14, category: 'Фрукты' },
  { name: 'Апельсин', kcal: 47, p: 0.9, f: 0.1, c: 12, category: 'Фрукты' },
  { name: 'Черника', kcal: 57, p: 0.7, f: 0.3, c: 14, category: 'Фрукты' },
  { name: 'Клубника', kcal: 32, p: 0.7, f: 0.3, c: 7.7, category: 'Фрукты' },
  { name: 'Груша', kcal: 57, p: 0.4, f: 0.1, c: 15, category: 'Фрукты' },

  // Орехи и масла
  { name: 'Арахисовая паста', kcal: 588, p: 25, f: 50, c: 20, category: 'Орехи и масла' },
  { name: 'Миндаль', kcal: 579, p: 21, f: 50, c: 22, category: 'Орехи и масла' },
  { name: 'Грецкий орех', kcal: 654, p: 15, f: 65, c: 14, category: 'Орехи и масла' },
  { name: 'Оливковое масло', kcal: 884, p: 0, f: 100, c: 0, category: 'Орехи и масла' },
  { name: 'Масло подсолнечное', kcal: 884, p: 0, f: 100, c: 0, category: 'Орехи и масла' },

  // Разное
  { name: 'Шоколад тёмный 70%+', kcal: 598, p: 8, f: 43, c: 46, category: 'Разное' },
  { name: 'Мёд', kcal: 304, p: 0.3, f: 0, c: 82, category: 'Разное' },
  { name: 'Протеиновый батончик', kcal: 350, p: 20, f: 10, c: 40, category: 'Разное' },
  { name: 'Кофе чёрный (без сахара)', kcal: 9, p: 0.6, f: 0.2, c: 1.6, category: 'Разное' },
];

export const FOOD_CATEGORIES = [...new Set(FOOD_DB.map(f => f.category))];

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return FOOD_DB;
  const q = query.toLowerCase();
  return FOOD_DB.filter(f => f.name.toLowerCase().includes(q));
}
