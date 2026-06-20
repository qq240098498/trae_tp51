import type {
  Dish,
  GroupMealConfig,
  GroupMealPlan,
  ShoppingItem,
  DietaryRestriction,
} from "@/types";
import { DISHES, INGREDIENT_CATEGORIES } from "@/data/dishes";
import { genId } from "@/lib/format";

const CATEGORY_BUDGET_RATIO = {
  cold: 0.18,
  hot: 0.60,
  soup: 0.12,
  staple: 0.10,
};

function filterByRestrictions(dishes: Dish[], restrictions: DietaryRestriction[]): Dish[] {
  if (restrictions.length === 0) return dishes;
  return dishes.filter((dish) => restrictions.every((r) => dish.restrictions.includes(r)));
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
  if (
    config?.coldDishCount !== undefined &&
    config?.hotDishCount !== undefined &&
    config?.soupCount !== undefined &&
    config?.stapleCount !== undefined
  ) {
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

function findBestCombination(
  dishes: Dish[],
  count: number,
  targetTotal: number,
  usedIds: Set<string> = new Set()
): Dish[] {
  const available = dishes.filter((d) => !usedIds.has(d.id));
  if (available.length === 0) return [];

  if (count >= available.length) {
    return shuffle(available);
  }

  const targetAvg = targetTotal / count;

  const sorted = [...available].sort((a, b) => {
    const diffA = Math.abs(a.price - targetAvg);
    const diffB = Math.abs(b.price - targetAvg);
    return diffA - diffB;
  });

  const windowSize = Math.max(count * 2, Math.min(sorted.length, count * 3));
  const candidates = sorted.slice(0, windowSize);
  const shuffled = shuffle(candidates);
  return shuffled.slice(0, count);
}

function calcTotalPrice(dishes: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] }) {
  return (
    dishes.cold.reduce((s, d) => s + d.price, 0) +
    dishes.hot.reduce((s, d) => s + d.price, 0) +
    dishes.soup.reduce((s, d) => s + d.price, 0) +
    dishes.staple.reduce((s, d) => s + d.price, 0)
  );
}

function adjustBudget(
  selected: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] },
  pools: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] },
  targetBudget: number,
  counts: { cold: number; hot: number; soup: number; staple: number }
) {
  const categories: ("cold" | "hot" | "soup" | "staple")[] = ["hot", "cold", "soup", "staple"];

  for (let iteration = 0; iteration < 30; iteration++) {
    const currentTotal = calcTotalPrice(selected);
    const diff = currentTotal - targetBudget;

    if (Math.abs(diff) <= targetBudget * 0.05) break;

    if (diff > 0) {
      for (const cat of categories) {
        if (selected[cat].length === 0) continue;
        const sorted = [...selected[cat]].sort((a, b) => b.price - a.price);
        for (const expensive of sorted) {
          const pool = pools[cat].filter(
            (p) => !selected[cat].some((s) => s.id === p.id) && p.price < expensive.price
          );
          if (pool.length === 0) continue;
          const cheaper = pool.sort((a, b) => {
            const aDiff = expensive.price - a.price;
            const bDiff = expensive.price - b.price;
            const aOver = aDiff >= diff * 0.5 ? 0 : 1;
            const bOver = bDiff >= diff * 0.5 ? 0 : 1;
            if (aOver !== bOver) return aOver - bOver;
            return Math.abs(a.price - (expensive.price - diff / counts[cat])) -
              Math.abs(b.price - (expensive.price - diff / counts[cat]));
          })[0];
          if (cheaper) {
            selected[cat] = selected[cat].map((d) => (d.id === expensive.id ? cheaper : d));
            break;
          }
        }
        const newTotal = calcTotalPrice(selected);
        if (Math.abs(newTotal - targetBudget) < Math.abs(diff)) break;
      }
    } else {
      const increaseNeeded = -diff;
      for (const cat of categories) {
        if (selected[cat].length === 0) continue;
        const sorted = [...selected[cat]].sort((a, b) => a.price - b.price);
        for (const cheap of sorted) {
          const pool = pools[cat].filter(
            (p) => !selected[cat].some((s) => s.id === p.id) && p.price > cheap.price
          );
          if (pool.length === 0) continue;
          const targetPrice = cheap.price + increaseNeeded / counts[cat];
          const pricier = pool.sort((a, b) => {
            const aDiff = a.price - cheap.price;
            const bDiff = b.price - cheap.price;
            const aOk = aDiff <= increaseNeeded * 1.1 ? 0 : 1;
            const bOk = bDiff <= increaseNeeded * 1.1 ? 0 : 1;
            if (aOk !== bOk) return aOk - bOk;
            return Math.abs(a.price - targetPrice) - Math.abs(b.price - targetPrice);
          })[0];
          if (pricier) {
            selected[cat] = selected[cat].map((d) => (d.id === cheap.id ? pricier : d));
            break;
          }
        }
        const newTotal = calcTotalPrice(selected);
        if (Math.abs(newTotal - targetBudget) < increaseNeeded) break;
      }
    }
  }

  return selected;
}

export function generateGroupMeal(config: GroupMealConfig): GroupMealPlan | null {
  const { peopleCount, budget, restrictions } = config;

  if (peopleCount <= 0 || budget <= 0) return null;

  const counts = calculateDishCounts(peopleCount, config);

  const allCold = filterByRestrictions(DISHES.filter((d) => d.category === "cold"), restrictions);
  const allHot = filterByRestrictions(DISHES.filter((d) => d.category === "hot"), restrictions);
  const allSoup = filterByRestrictions(DISHES.filter((d) => d.category === "soup"), restrictions);
  const allStaple = filterByRestrictions(DISHES.filter((d) => d.category === "staple"), restrictions);

  if (allCold.length === 0 || allHot.length === 0) {
    return null;
  }

  const minColdPrices = [...allCold].sort((a, b) => a.price - b.price).slice(0, counts.cold);
  const minHotPrices = [...allHot].sort((a, b) => a.price - b.price).slice(0, counts.hot);
  const minSoupPrices = [...allSoup].sort((a, b) => a.price - b.price).slice(0, counts.soup);
  const minStaplePrices = [...allStaple].sort((a, b) => a.price - b.price).slice(0, counts.staple);

  const minPossible =
    minColdPrices.reduce((s, d) => s + d.price, 0) +
    minHotPrices.reduce((s, d) => s + d.price, 0) +
    minSoupPrices.reduce((s, d) => s + d.price, 0) +
    minStaplePrices.reduce((s, d) => s + d.price, 0);

  let adjustedBudget = budget;
  if (minPossible > 0 && minPossible > budget) {
    adjustedBudget = minPossible;
  }

  let bestResult: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] } | null = null;
  let bestDiff = Infinity;

  for (let attempt = 0; attempt < 15; attempt++) {
    const coldTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.cold;
    const hotTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.hot;
    const soupTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.soup;
    const stapleTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.staple;

    const coldDishes = findBestCombination(allCold, counts.cold, coldTarget);
    const hotDishes = findBestCombination(allHot, counts.hot, hotTarget);
    const soupDishes = allSoup.length > 0
      ? findBestCombination(allSoup, counts.soup, soupTarget)
      : [];
    const stapleDishes = allStaple.length > 0
      ? findBestCombination(allStaple, counts.staple, stapleTarget)
      : [];

    let result = {
      cold: coldDishes,
      hot: hotDishes,
      soup: soupDishes,
      staple: stapleDishes,
    };

    result = adjustBudget(
      result,
      { cold: allCold, hot: allHot, soup: allSoup, staple: allStaple },
      adjustedBudget,
      counts
    );

    const total = calcTotalPrice(result);
    const diff = Math.abs(total - adjustedBudget);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestResult = result;
    }

    if (diff <= adjustedBudget * 0.03) break;
  }

  if (!bestResult) return null;

  const { cold: coldDishes, hot: hotDishes, soup: soupDishes, staple: stapleDishes } = bestResult;

  if (coldDishes.length === 0 || hotDishes.length === 0) {
    return null;
  }

  const allDishes = [...coldDishes, ...hotDishes, ...soupDishes, ...stapleDishes];
  const totalPrice = calcTotalPrice(bestResult);
  const shoppingList = generateShoppingList(allDishes, peopleCount);
  const planName = generatePlanName(peopleCount, restrictions);

  return {
    id: genId("gm"),
    name: planName,
    peopleCount,
    budget,
    adjustedBudget: adjustedBudget !== budget ? adjustedBudget : undefined,
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
  const allByCategory: Record<string, Dish[]> = {
    cold: DISHES.filter((d) => d.category === "cold"),
    hot: DISHES.filter((d) => d.category === "hot"),
    soup: DISHES.filter((d) => d.category === "soup"),
    staple: DISHES.filter((d) => d.category === "staple"),
  };

  const available = filterByRestrictions(allByCategory[category], restrictions).filter(
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

  const otherDishes = [
    ...currentPlan.coldDishes,
    ...currentPlan.hotDishes,
    ...currentPlan.soupDishes,
    ...currentPlan.stapleDishes,
  ]
    .filter((d) => d.id !== dishId)
    .reduce((s, d) => s + d.price, 0);

  const targetDishPrice = currentPlan.budget - otherDishes;

  const candidates = available.filter(
    (d) => !currentCategoryDishes.some((cd) => cd.id === d.id)
  );

  if (candidates.length === 0) return currentPlan;

  const sorted = candidates.sort((a, b) => {
    const diffA = Math.abs(a.price - currentDish.price);
    const diffB = Math.abs(b.price - currentDish.price);
    const budgetA = Math.abs(a.price - targetDishPrice);
    const budgetB = Math.abs(b.price - targetDishPrice);
    return (diffA + budgetA * 0.3) - (diffB + budgetB * 0.3);
  });

  const shuffled = shuffle(sorted.slice(0, Math.min(5, sorted.length)));
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
