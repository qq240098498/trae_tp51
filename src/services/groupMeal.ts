import type {
  Dish,
  GroupMealConfig,
  GroupMealPlan,
  ShoppingItem,
  DietaryRestriction,
} from "@/types";
import { DISHES, INGREDIENT_CATEGORIES } from "@/data/dishes";
import { genId } from "@/lib/format";

function filterByCategory(dishes: Dish[], restrictions: DietaryRestriction[]): Dish[] {
  if (restrictions.length === 0) return dishes;
  return dishes.filter((dish) => restrictions.every((r) => dish.restrictions.includes(r)));
}

function getDishesByCategory(category: Dish["category"]): Dish[] {
  return DISHES.filter((d) => d.category === category);
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function calculateDishCounts(peopleCount: number, config?: GroupMealConfig) {
  if (config?.coldDishCount !== undefined &&
      config?.hotDishCount !== undefined &&
      config?.soupCount !== undefined &&
      config?.stapleCount !== undefined) {
    return {
      cold: config.coldDishCount,
      hot: config.hotDishCount,
      soup: config.soupCount,
      staple: config.stapleCount,
    };
  }

  const cold = Math.max(2, Math.ceil(peopleCount / 4));
  const hot = Math.max(3, Math.ceil(peopleCount / 2));
  const soup = Math.max(1, Math.ceil(peopleCount / 8));
  const staple = Math.max(1, Math.ceil(peopleCount / 6));

  return { cold, hot, soup, staple };
}

function selectDishes(
  category: Dish["category"],
  count: number,
  restrictions: DietaryRestriction[],
  budgetPerDish: number
): Dish[] {
  const available = filterByCategory(getDishesByCategory(category), restrictions);

  const affordable = available.filter((d) => d.price <= budgetPerDish * 1.5);

  if (affordable.length === 0) return [];

  const sorted = [...affordable].sort((a, b) => a.price - b.price);

  const midPoint = Math.floor(sorted.length * 0.6);
  const midRange = sorted.slice(0, Math.max(count, midPoint));

  const shuffled = shuffle(midRange);
  return shuffled.slice(0, count);
}

export function generateGroupMeal(config: GroupMealConfig): GroupMealPlan | null {
  const { peopleCount, budget, restrictions } = config;

  if (peopleCount <= 0 || budget <= 0) return null;

  const counts = calculateDishCounts(peopleCount, config);
  const totalDishes = counts.cold + counts.hot + counts.soup + counts.staple;

  if (totalDishes === 0) return null;

  const avgBudgetPerDish = budget / totalDishes;

  let coldDishes: Dish[] = [];
  let hotDishes: Dish[] = [];
  let soupDishes: Dish[] = [];
  let stapleDishes: Dish[] = [];
  let totalPrice = 0;

  for (let attempt = 0; attempt < 10; attempt++) {
    coldDishes = selectDishes("cold", counts.cold, restrictions, avgBudgetPerDish);
    hotDishes = selectDishes("hot", counts.hot, restrictions, avgBudgetPerDish);
    soupDishes = selectDishes("soup", counts.soup, restrictions, avgBudgetPerDish);
    stapleDishes = selectDishes("staple", counts.staple, restrictions, avgBudgetPerDish);

    totalPrice = [...coldDishes, ...hotDishes, ...soupDishes, ...stapleDishes]
      .reduce((sum, d) => sum + d.price, 0);

    if (totalPrice <= budget && totalPrice >= budget * 0.7) {
      break;
    }
  }

  if (coldDishes.length === 0 || hotDishes.length === 0) {
    return null;
  }

  const allDishes = [...coldDishes, ...hotDishes, ...soupDishes, ...stapleDishes];
  totalPrice = allDishes.reduce((sum, d) => sum + d.price, 0);

  const shoppingList = generateShoppingList(allDishes, peopleCount);

  const planName = generatePlanName(peopleCount, restrictions);

  return {
    id: genId("gm"),
    name: planName,
    peopleCount,
    budget,
    totalPrice,
    restrictions,
    coldDishes,
    hotDishes,
    soupDishes,
    stapleDishes,
    shoppingList,
  };
}

function generatePlanName(peopleCount: number, restrictions: DietaryRestriction[]): string {
  let prefix = "标准";
  if (restrictions.includes("vegetarian") || restrictions.includes("vegan")) {
    prefix = "素食";
  } else if (restrictions.includes("no_spicy")) {
    prefix = "清淡";
  } else if (restrictions.includes("no_seafood")) {
    prefix = "家常";
  }

  const sizeLabel = peopleCount <= 4 ? "小聚" : peopleCount <= 8 ? "中聚" : "盛宴";

  return `${prefix}${sizeLabel}套餐`;
}

function generateShoppingList(dishes: Dish[], peopleCount: number): ShoppingItem[] {
  const ingredientMap = new Map<string, { amount: number; unit: string; category: string }>();

  for (const dish of dishes) {
    const multiplier = Math.ceil(peopleCount / dish.servingSize);
    for (const ing of dish.ingredients) {
      const existing = ingredientMap.get(ing.name);
      if (existing) {
        existing.amount += ing.amount * multiplier;
      } else {
        ingredientMap.set(ing.name, {
          amount: ing.amount * multiplier,
          unit: ing.unit,
          category: INGREDIENT_CATEGORIES[ing.name] || "其他",
        });
      }
    }
  }

  const items: ShoppingItem[] = [];
  for (const [name, info] of ingredientMap) {
    items.push({
      name,
      totalAmount: Math.ceil(info.amount * 1.1),
      unit: info.unit,
      category: info.category,
    });
  }

  items.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  return items;
}

export function regenerateDishes(
  currentPlan: GroupMealPlan,
  category: "cold" | "hot" | "soup" | "staple",
  dishId: string
): GroupMealPlan {
  const restrictions = currentPlan.restrictions;
  const available = filterByCategory(getDishesByCategory(category), restrictions).filter(
    (d) => d.id !== dishId
  );

  const currentDishes = {
    cold: currentPlan.coldDishes,
    hot: currentPlan.hotDishes,
    soup: currentPlan.soupDishes,
    staple: currentPlan.stapleDishes,
  };

  const currentCategoryDishes = currentDishes[category];
  const currentDish = currentCategoryDishes.find((d) => d.id === dishId);

  if (!currentDish || available.length === 0) return currentPlan;

  const targetPrice = currentDish.price;
  const candidates = available.filter(
    (d) =>
      !currentCategoryDishes.some((cd) => cd.id === d.id) &&
      Math.abs(d.price - targetPrice) <= targetPrice * 0.3
  );

  const replacementCandidates = candidates.length > 0 ? candidates : available;
  const shuffled = shuffle(replacementCandidates);
  const newDish = shuffled[0];

  if (!newDish) return currentPlan;

  const newCategoryDishes = currentCategoryDishes.map((d) =>
    d.id === dishId ? newDish : d
  );

  const allDishes = [
    ...(category === "cold" ? newCategoryDishes : currentPlan.coldDishes),
    ...(category === "hot" ? newCategoryDishes : currentPlan.hotDishes),
    ...(category === "soup" ? newCategoryDishes : currentPlan.soupDishes),
    ...(category === "staple" ? newCategoryDishes : currentPlan.stapleDishes),
  ];

  const totalPrice = allDishes.reduce((sum, d) => sum + d.price, 0);
  const shoppingList = generateShoppingList(allDishes, currentPlan.peopleCount);

  return {
    ...currentPlan,
    coldDishes: category === "cold" ? (newCategoryDishes as Dish[]) : currentPlan.coldDishes,
    hotDishes: category === "hot" ? (newCategoryDishes as Dish[]) : currentPlan.hotDishes,
    soupDishes: category === "soup" ? (newCategoryDishes as Dish[]) : currentPlan.soupDishes,
    stapleDishes: category === "staple" ? (newCategoryDishes as Dish[]) : currentPlan.stapleDishes,
    totalPrice,
    shoppingList,
  };
}
