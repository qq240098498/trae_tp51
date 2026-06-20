import type {
  Dish,
  GroupMealConfig,
  GroupMealPlan,
  ShoppingItem,
  DietaryRestriction,
  DishCategory,
} from "@/types";
import { DISHES, INGREDIENT_CATEGORIES } from "@/data/dishes";
import { genId } from "@/lib/format";

const CATEGORY_BUDGET_RATIO = {
  cold: 0.18,
  hot: 0.60,
  soup: 0.12,
  staple: 0.10,
};

const SERVING_RATIO = {
  cold: 0.6,
  hot: 0.9,
  soup: 1.0,
  staple: 1.0,
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

function sumServingSize(dishes: Dish[]): number {
  return dishes.reduce((sum, d) => sum + d.servingSize, 0);
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

function ensureServingSize(
  selected: Dish[],
  pool: Dish[],
  targetServing: number,
  maxDishes: number
): Dish[] {
  const result = [...selected];
  let currentServing = sumServingSize(result);

  let iterations = 0;
  while (currentServing < targetServing && result.length < maxDishes && iterations < 20) {
    const usedIds = new Set(result.map((d) => d.id));
    const available = pool.filter((d) => !usedIds.has(d.id));

    if (available.length === 0) break;

    const deficit = targetServing - currentServing;
    const sorted = [...available].sort((a, b) => {
      const aDiff = Math.abs(a.servingSize - deficit);
      const bDiff = Math.abs(b.servingSize - deficit);
      return aDiff - bDiff;
    });

    const topCandidates = sorted.slice(0, Math.min(3, sorted.length));
    const pick = shuffle(topCandidates)[0];

    result.push(pick);
    currentServing = sumServingSize(result);
    iterations++;
  }

  return result;
}

function findBudgetFitCombination(
  pool: Dish[],
  count: number,
  targetTotal: number,
  minServing: number
): Dish[] {
  if (pool.length === 0) return [];

  const targetAvg = targetTotal / Math.max(count, 1);

  let best: Dish[] = [];
  let bestScore = Infinity;

  const totalServingAvailable = sumServingSize(pool);
  const actualMinServing = Math.min(minServing, totalServingAvailable);

  for (let attempt = 0; attempt < 12; attempt++) {
    const sortedByPrice = [...pool].sort((a, b) => {
      const diffA = Math.abs(a.price - targetAvg);
      const diffB = Math.abs(b.price - targetAvg);
      return diffA - diffB;
    });

    const windowSize = Math.min(pool.length, Math.max(count * 2, count + 4));
    const candidates = shuffle(sortedByPrice.slice(0, windowSize));
    const selected = candidates.slice(0, count);

    const withServing = ensureServingSize(selected, pool, actualMinServing, count + 5);

    const total = withServing.reduce((s, d) => s + d.price, 0);
    const serving = sumServingSize(withServing);

    if (serving < actualMinServing * 0.8 && withServing.length < pool.length) continue;

    const priceDiff = Math.abs(total - targetTotal);
    const servingGap = Math.max(0, actualMinServing - serving);
    const score = priceDiff + servingGap * 5;

    if (score < bestScore) {
      bestScore = score;
      best = withServing;
    }

    if (priceDiff <= targetTotal * 0.08 && serving >= actualMinServing) break;
  }

  if (best.length === 0 && pool.length > 0) {
    best = pool.slice(0, Math.min(count, pool.length));
  }

  return best;
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
  minServingByCat: { cold: number; hot: number; soup: number; staple: number }
) {
  const categories: ("cold" | "hot" | "soup" | "staple")[] = ["hot", "cold", "soup", "staple"];
  const result = { ...selected };

  for (let iteration = 0; iteration < 40; iteration++) {
    const currentTotal = calcTotalPrice(result);
    const diff = currentTotal - targetBudget;

    if (Math.abs(diff) <= targetBudget * 0.05) break;

    let improved = false;

    if (diff > 0) {
      for (const cat of categories) {
        if (result[cat].length <= 1) continue;

        const catMinServing = minServingByCat[cat];
        const sorted = [...result[cat]].sort((a, b) => b.price - a.price);

        for (const expensive of sorted) {
          const others = result[cat].filter((d) => d.id !== expensive.id);
          const othersServing = sumServingSize(others);
          const minNeed = Math.max(0, catMinServing - othersServing);

          const pool = pools[cat].filter(
            (p) =>
              !result[cat].some((s) => s.id === p.id) &&
              p.price < expensive.price &&
              p.servingSize >= minNeed
          );

          if (pool.length === 0) continue;

          const targetPrice = expensive.price - diff / result[cat].length;
          const candidates = pool.sort((a, b) => {
            const aDiff = Math.abs(a.price - targetPrice);
            const bDiff = Math.abs(b.price - targetPrice);
            return aDiff - bDiff;
          }).slice(0, Math.min(3, pool.length));

          const pick = shuffle(candidates)[0];

          if (pick) {
            result[cat] = result[cat].map((d) => (d.id === expensive.id ? pick : d));
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    } else {
      const increaseNeeded = -diff;
      for (const cat of categories) {
        if (result[cat].length === 0) continue;

        const sorted = [...result[cat]].sort((a, b) => a.price - b.price);

        for (const cheap of sorted) {
          const pool = pools[cat].filter(
            (p) => !result[cat].some((s) => s.id === p.id) && p.price > cheap.price
          );

          if (pool.length === 0) continue;

          const targetPrice = cheap.price + increaseNeeded / result[cat].length;
          const candidates = pool
            .filter((p) => p.price - cheap.price <= increaseNeeded * 1.2)
            .sort((a, b) => {
              const aDiff = Math.abs(a.price - targetPrice);
              const bDiff = Math.abs(b.price - targetPrice);
              return aDiff - bDiff;
            })
            .slice(0, Math.min(3, pool.length));

          if (candidates.length === 0) continue;

          const pick = shuffle(candidates)[0];

          if (pick) {
            result[cat] = result[cat].map((d) => (d.id === cheap.id ? pick : d));
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    if (!improved) break;
  }

  return result;
}

export function generateGroupMeal(config: GroupMealConfig): GroupMealPlan | null {
  const { peopleCount, budget, restrictions } = config;

  if (peopleCount <= 0 || budget <= 0) return null;

  const allByCat: Record<DishCategory, Dish[]> = {
    cold: filterByRestrictions(DISHES.filter((d) => d.category === "cold"), restrictions),
    hot: filterByRestrictions(DISHES.filter((d) => d.category === "hot"), restrictions),
    soup: filterByRestrictions(DISHES.filter((d) => d.category === "soup"), restrictions),
    staple: filterByRestrictions(DISHES.filter((d) => d.category === "staple"), restrictions),
  };

  if (allByCat.cold.length === 0 || allByCat.hot.length === 0) {
    return null;
  }

  const minServingByCat = {
    cold: peopleCount * SERVING_RATIO.cold,
    hot: peopleCount * SERVING_RATIO.hot,
    soup: peopleCount * SERVING_RATIO.soup,
    staple: peopleCount * SERVING_RATIO.staple,
  };

  let adjustedBudget = budget;
  const minPossible = calcMinBudget(allByCat, minServingByCat);

  if (minPossible > budget) {
    adjustedBudget = minPossible;
  }

  const baseCounts = calculateDishCounts(peopleCount, config);

  let bestValid: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] } | null = null;
  let bestValidDiff = Infinity;
  let bestOverall: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] } | null = null;
  let bestOverallScore = Infinity;

  for (let attempt = 0; attempt < 15; attempt++) {
    const coldTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.cold;
    const hotTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.hot;
    const soupTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.soup;
    const stapleTarget = adjustedBudget * CATEGORY_BUDGET_RATIO.staple;

    const coldDishes = findBudgetFitCombination(
      allByCat.cold,
      baseCounts.cold,
      coldTarget,
      minServingByCat.cold
    );
    const hotDishes = findBudgetFitCombination(
      allByCat.hot,
      baseCounts.hot,
      hotTarget,
      minServingByCat.hot
    );
    const soupDishes = allByCat.soup.length > 0
      ? findBudgetFitCombination(allByCat.soup, baseCounts.soup, soupTarget, minServingByCat.soup)
      : [];
    const stapleDishes = allByCat.staple.length > 0
      ? findBudgetFitCombination(allByCat.staple, baseCounts.staple, stapleTarget, minServingByCat.staple)
      : [];

    let result = {
      cold: coldDishes,
      hot: hotDishes,
      soup: soupDishes,
      staple: stapleDishes,
    };

    result = adjustBudget(result, allByCat, adjustedBudget, minServingByCat);

    const total = calcTotalPrice(result);
    const priceDiff = Math.abs(total - adjustedBudget);

    const coldServing = sumServingSize(result.cold);
    const hotServing = sumServingSize(result.hot);
    const soupServing = sumServingSize(result.soup);
    const stapleServing = sumServingSize(result.staple);

    const coldOk = coldServing >= minServingByCat.cold && result.cold.length > 0;
    const hotOk = hotServing >= minServingByCat.hot && result.hot.length > 0;
    const soupOk = allByCat.soup.length === 0 ||
      (soupServing >= minServingByCat.soup && result.soup.length > 0);
    const stapleOk = allByCat.staple.length === 0 ||
      (stapleServing >= minServingByCat.staple && result.staple.length > 0);

    const isValid = coldOk && hotOk && soupOk && stapleOk;

    if (isValid && priceDiff < bestValidDiff) {
      bestValidDiff = priceDiff;
      bestValid = result;
    }

    const servingGap =
      Math.max(0, minServingByCat.cold - coldServing) +
      Math.max(0, minServingByCat.hot - hotServing) +
      Math.max(0, minServingByCat.soup - soupServing) +
      Math.max(0, minServingByCat.staple - stapleServing);

    const overallScore = priceDiff + servingGap * 10;
    if (overallScore < bestOverallScore && result.cold.length > 0 && result.hot.length > 0) {
      bestOverallScore = overallScore;
      bestOverall = result;
    }

    if (isValid && priceDiff <= adjustedBudget * 0.04) break;
  }

  let bestResult = bestValid || bestOverall;

  if (!bestResult) {
    const fallback = buildFallbackPlan(allByCat, minServingByCat, baseCounts);
    bestResult = fallback || null;
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

function calcMinBudget(
  pools: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] },
  minServing: { cold: number; hot: number; soup: number; staple: number }
): number {
  function calcCategoryMin(pool: Dish[], targetServing: number): number {
    if (pool.length === 0) return 0;
    const sorted = [...pool].sort((a, b) => a.price / a.servingSize - b.price / b.servingSize);
    let totalServing = 0;
    let totalPrice = 0;
    const used = new Set<string>();

    while (totalServing < targetServing && used.size < sorted.length) {
      const cheapest = sorted.find((d) => !used.has(d.id));
      if (!cheapest) break;
      used.add(cheapest.id);
      totalPrice += cheapest.price;
      totalServing += cheapest.servingSize;
    }

    return totalPrice;
  }

  return (
    calcCategoryMin(pools.cold, minServing.cold) +
    calcCategoryMin(pools.hot, minServing.hot) +
    calcCategoryMin(pools.soup, minServing.soup) +
    calcCategoryMin(pools.staple, minServing.staple)
  );
}

function buildFallbackPlan(
  pools: { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] },
  minServing: { cold: number; hot: number; soup: number; staple: number },
  baseCounts: { cold: number; hot: number; soup: number; staple: number }
): { cold: Dish[]; hot: Dish[]; soup: Dish[]; staple: Dish[] } | null {
  function buildCategory(pool: Dish[], minCount: number, targetServing: number): Dish[] {
    const sorted = [...pool].sort((a, b) => a.price - b.price);
    const result: Dish[] = [];
    const used = new Set<string>();

    for (const dish of sorted) {
      if (result.length >= minCount && sumServingSize(result) >= targetServing) break;
      if (!used.has(dish.id)) {
        result.push(dish);
        used.add(dish.id);
      }
    }

    while (sumServingSize(result) < targetServing && result.length < pool.length) {
      const remaining = pool.filter((d) => !used.has(d.id));
      if (remaining.length === 0) break;
      const next = remaining.sort((a, b) => b.servingSize - a.servingSize)[0];
      result.push(next);
      used.add(next.id);
    }

    return result;
  }

  const cold = buildCategory(pools.cold, baseCounts.cold, minServing.cold);
  const hot = buildCategory(pools.hot, baseCounts.hot, minServing.hot);
  const soup = pools.soup.length > 0
    ? buildCategory(pools.soup, Math.max(1, baseCounts.soup), minServing.soup)
    : [];
  const staple = pools.staple.length > 0
    ? buildCategory(pools.staple, Math.max(1, baseCounts.staple), minServing.staple)
    : [];

  if (cold.length === 0 || hot.length === 0) return null;

  return { cold, hot, soup, staple };
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

  const pool = filterByRestrictions(allByCategory[category], restrictions).filter(
    (d) => d.id !== dishId
  );

  const currentCategoryDishes = {
    cold: currentPlan.coldDishes,
    hot: currentPlan.hotDishes,
    soup: currentPlan.soupDishes,
    staple: currentPlan.stapleDishes,
  }[category];

  const currentDish = currentCategoryDishes.find((d) => d.id === dishId);

  if (!currentDish || pool.length === 0) return currentPlan;

  const otherDishes = currentCategoryDishes.filter((d) => d.id !== dishId);
  const otherPrice = otherDishes.reduce((s, d) => s + d.price, 0);
  const categoryBudget = currentPlan.totalPrice * CATEGORY_BUDGET_RATIO[category];
  const targetPrice = categoryBudget - otherPrice;

  const candidates = pool.filter(
    (d) => !currentCategoryDishes.some((cd) => cd.id === d.id)
  );

  if (candidates.length === 0) return currentPlan;

  const sorted = candidates.sort((a, b) => {
    const priceDiffA = Math.abs(a.price - targetPrice);
    const priceDiffB = Math.abs(b.price - targetPrice);
    const sizeDiffA = Math.abs(a.servingSize - currentDish.servingSize);
    const sizeDiffB = Math.abs(b.servingSize - currentDish.servingSize);
    return priceDiffA + sizeDiffA * 2 - (priceDiffB + sizeDiffB * 2);
  });

  const shuffled = shuffle(sorted.slice(0, Math.min(5, sorted.length)));
  const newDish = shuffled[0];

  if (!newDish) return currentPlan;

  const newCategoryDishes = currentCategoryDishes.map((d) =>
    d.id === dishId ? newDish : d
  ) as Dish[];

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
    coldDishes: category === "cold" ? newCategoryDishes : currentPlan.coldDishes,
    hotDishes: category === "hot" ? newCategoryDishes : currentPlan.hotDishes,
    soupDishes: category === "soup" ? newCategoryDishes : currentPlan.soupDishes,
    stapleDishes: category === "staple" ? newCategoryDishes : currentPlan.stapleDishes,
    totalPrice,
    shoppingList,
  };
}
