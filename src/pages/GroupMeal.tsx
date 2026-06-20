import { useState } from "react";
import {
  RefreshCw,
  Shuffle,
  ShoppingCart,
  Users,
  Wallet,
  Utensils,
  ChefHat,
  Leaf,
  Soup,
  Croissant,
  Sparkles,
  Check,
} from "lucide-react";
import type { GroupMealConfig, GroupMealPlan, DietaryRestriction, Dish } from "@/types";
import { generateGroupMeal, regenerateDishes, calculateDishCounts } from "@/services/groupMeal";
import { DIETARY_LABELS } from "@/data/dishes";
import { yuan } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import Badge from "@/components/ui/Badge";

const ALL_RESTRICTIONS: DietaryRestriction[] = [
  "vegetarian",
  "no_spicy",
  "no_seafood",
  "no_pork",
  "no_beef",
  "low_salt",
];

export default function GroupMeal() {
  const [config, setConfig] = useState<GroupMealConfig>({
    peopleCount: 8,
    budget: 500,
    restrictions: [],
  });
  const [plan, setPlan] = useState<GroupMealPlan | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const handleGenerate = () => {
    const result = generateGroupMeal(config);
    setPlan(result);
    setShowShoppingList(false);
  };

  const handleRegenerateDish = (category: "cold" | "hot" | "soup" | "staple", dishId: string) => {
    if (!plan) return;
    const newPlan = regenerateDishes(plan, category, dishId);
    setPlan(newPlan);
  };

  const toggleRestriction = (r: DietaryRestriction) => {
    setConfig((prev) => ({
      ...prev,
      restrictions: prev.restrictions.includes(r)
        ? prev.restrictions.filter((x) => x !== r)
        : [...prev.restrictions, r],
    }));
  };

  const dishCounts = calculateDishCounts(config.peopleCount, config);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="团餐菜单搭配"
        description="按人数、预算、忌口自动搭配团餐菜单，一键生成采购清单"
        actions={
          plan && (
            <Button
              variant="secondary"
              icon={<ShoppingCart size={16} />}
              onClick={() => setShowShoppingList(!showShoppingList)}
            >
              {showShoppingList ? "查看菜单" : "采购清单"}
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card p-5">
            <h3 className="mb-4 font-serif text-lg font-semibold text-ink">搭配条件</h3>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="用餐人数" required>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <TextInput
                      type="number"
                      min={1}
                      max={50}
                      value={config.peopleCount}
                      onChange={(e) =>
                        setConfig({ ...config, peopleCount: Number(e.target.value) })
                      }
                      className="pl-9"
                    />
                  </div>
                </Field>
                <Field label="预算（元）" required>
                  <div className="relative">
                    <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <TextInput
                      type="number"
                      min={50}
                      value={config.budget}
                      onChange={(e) =>
                        setConfig({ ...config, budget: Number(e.target.value) })
                      }
                      className="pl-9"
                    />
                  </div>
                </Field>
              </div>

              <Field label="忌口要求">
                <div className="flex flex-wrap gap-2">
                  {ALL_RESTRICTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleRestriction(r)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition ${
                        config.restrictions.includes(r)
                          ? "border-forest-400 bg-forest-50 text-forest-700"
                          : "border-ink/10 text-ink/60 hover:bg-ink/5"
                      }`}
                    >
                      {config.restrictions.includes(r) && <Check size={12} />}
                      {DIETARY_LABELS[r]}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="rounded-lg bg-ink/5 p-3 text-xs text-muted">
                <p className="font-medium text-ink/70">预计搭配：</p>
                <p className="mt-1">
                  凉菜 {dishCounts.cold} 道 · 热菜 {dishCounts.hot} 道 · 汤 {dishCounts.soup} 道 · 主食 {dishCounts.staple} 道
                </p>
              </div>

              <Button
                icon={<Sparkles size={16} />}
                onClick={handleGenerate}
                className="w-full"
                size="lg"
              >
                智能搭配
              </Button>
            </div>
          </div>

          {plan && (
            <div className="card mt-5 p-5">
              <h3 className="mb-3 font-serif text-lg font-semibold text-ink">{plan.name}</h3>

              {plan.adjustedBudget && plan.adjustedBudget > plan.budget && (
                <div className="mb-4 rounded-lg bg-clay-50 border border-clay-100 px-3 py-2 text-xs text-clay-600">
                  预算偏低，已按最低可搭配标准 {yuan(plan.adjustedBudget)} 生成
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">用餐人数</span>
                  <span className="font-medium text-ink">{plan.peopleCount} 人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">菜品总数</span>
                  <span className="font-medium text-ink">
                    {plan.coldDishes.length + plan.hotDishes.length + plan.soupDishes.length + plan.stapleDishes.length} 道
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">预算</span>
                  <span className="font-medium text-ink">{yuan(plan.budget)}</span>
                </div>
                <div className="border-t border-ink/10 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">总计</span>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${
                        plan.totalPrice <= (plan.adjustedBudget || plan.budget) * 1.05
                          ? "text-forest-600"
                          : "text-clay-500"
                      }`}>
                        {yuan(plan.totalPrice)}
                      </span>
                      {(() => {
                        const refBudget = plan.adjustedBudget || plan.budget;
                        const diff = plan.totalPrice - refBudget;
                        const pct = Math.abs(diff) / refBudget * 100;
                        return (
                          <p className={`mt-1 text-xs ${
                            Math.abs(diff) <= refBudget * 0.05 ? "text-forest-600" : "text-clay-500"
                          }`}>
                            {diff >= 0 ? `超出 ${yuan(diff)} (${pct.toFixed(1)}%)` : `节省 ${yuan(-diff)} (${pct.toFixed(1)}%)`}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {plan.restrictions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {plan.restrictions.map((r) => (
                    <Badge key={r} tone="muted">
                      {DIETARY_LABELS[r]}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!plan ? (
            <div className="card flex h-96 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-100 text-forest-500">
                <ChefHat size={32} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-ink">智能搭配团餐</h3>
              <p className="mt-2 max-w-sm text-sm text-muted">
                输入用餐人数和预算，根据忌口要求自动搭配凉菜、热菜、汤和主食，
                并生成详细的食材采购清单，方便备货。
              </p>
              <Button icon={<Sparkles size={16} />} onClick={handleGenerate} className="mt-6">
                开始搭配
              </Button>
            </div>
          ) : showShoppingList ? (
            <ShoppingListDisplay plan={plan} />
          ) : (
            <MenuDisplay plan={plan} onRegenerate={handleRegenerateDish} />
          )}
        </div>
      </div>
    </div>
  );
}

function MenuDisplay({
  plan,
  onRegenerate,
}: {
  plan: GroupMealPlan;
  onRegenerate: (category: "cold" | "hot" | "soup" | "staple", dishId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <DishSection
        title="凉菜"
        icon={<Leaf size={18} />}
        dishes={plan.coldDishes}
        category="cold"
        tone="mint"
        onRegenerate={onRegenerate}
      />
      <DishSection
        title="热菜"
        icon={<Utensils size={18} />}
        dishes={plan.hotDishes}
        category="hot"
        tone="clay"
        onRegenerate={onRegenerate}
      />
      <DishSection
        title="汤品"
        icon={<Soup size={18} />}
        dishes={plan.soupDishes}
        category="soup"
        tone="sky"
        onRegenerate={onRegenerate}
      />
      <DishSection
        title="主食"
        icon={<Croissant size={18} />}
        dishes={plan.stapleDishes}
        category="staple"
        tone="amber"
        onRegenerate={onRegenerate}
      />
    </div>
  );
}

function DishSection({
  title,
  icon,
  dishes,
  category,
  tone,
  onRegenerate,
}: {
  title: string;
  icon: React.ReactNode;
  dishes: Dish[];
  category: "cold" | "hot" | "soup" | "staple";
  tone: "mint" | "clay" | "sky" | "amber";
  onRegenerate: (category: "cold" | "hot" | "soup" | "staple", dishId: string) => void;
}) {
  const toneColors: Record<string, string> = {
    mint: "bg-mint-100 text-mint-700",
    clay: "bg-clay-100 text-clay-600",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneColors[tone]}`}>
            {icon}
          </span>
          <h3 className="font-serif text-base font-semibold text-ink">
            {title} <span className="text-sm font-normal text-muted">({dishes.length}道)</span>
          </h3>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onRegenerate={() => onRegenerate(category, dish.id)}
          />
        ))}
      </div>
    </div>
  );
}

function DishCard({ dish, onRegenerate }: { dish: Dish; onRegenerate: () => void }) {
  return (
    <div className="group rounded-xl border border-ink/10 bg-paper/50 p-3 transition hover:border-ink/20 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-ink">{dish.name}</h4>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{dish.description}</p>
        </div>
        <span className="ml-2 shrink-0 font-semibold text-forest-600">{yuan(dish.price)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {dish.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] text-ink/60"
            >
              {tag}
            </span>
          ))}
          {dish.spicyLevel !== undefined && dish.spicyLevel > 0 && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">
              {"🌶".repeat(dish.spicyLevel)}
            </span>
          )}
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:text-forest-600"
        >
          <Shuffle size={12} />
          换一换
        </button>
      </div>
    </div>
  );
}

function ShoppingListDisplay({ plan }: { plan: GroupMealPlan }) {
  const grouped = plan.shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof plan.shoppingList>);

  const categoryOrder = ["肉类", "海鲜水产", "蔬菜", "豆制品", "蛋制品", "米面杂粮", "葱姜蒜", "干果调料", "调味", "腌制品"];

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const totalItems = plan.shoppingList.length;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-100 text-forest-600">
            <ShoppingCart size={18} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">食材采购清单</h3>
            <p className="text-xs text-muted">共 {totalItems} 项食材 · 按 {plan.peopleCount} 人份备料</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />}>
          打印清单
        </Button>
      </div>

      <div className="max-h-[600px] overflow-y-auto p-5">
        <div className="space-y-5">
          {sortedCategories.map((category) => (
            <div key={category}>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-ink/70">
                <span className="h-1.5 w-1.5 rounded-full bg-forest-400" />
                {category}
                <span className="text-xs font-normal text-muted">
                  ({grouped[category].length}项)
                </span>
              </h4>
              <div className="overflow-hidden rounded-lg border border-ink/10">
                {grouped[category].map((item, idx) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      idx !== grouped[category].length - 1 ? "border-b border-ink/5" : ""
                    } bg-paper/30 hover:bg-paper/60`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded border border-ink/20 text-transparent hover:border-forest-400 hover:bg-forest-50 hover:text-forest-600 cursor-pointer transition flex items-center justify-center">
                        <Check size={12} />
                      </span>
                      <span className="text-sm text-ink">{item.name}</span>
                    </div>
                    <span className="font-mono text-sm font-medium text-ink/70">
                      {formatAmount(item.totalAmount)} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-forest-50 p-4">
          <p className="text-xs text-forest-700">
            <span className="font-medium">温馨提示：</span>
            采购清单已按 {plan.peopleCount} 人份量计算，并预留 10% 损耗。
            实际采购可根据情况适当调整。
          </p>
        </div>
      </div>
    </div>
  );
}

function formatAmount(amount: number): string {
  if (amount >= 1000 && (amount % 1000 === 0 || amount / 1000 >= 1)) {
    const kg = amount / 1000;
    return kg % 1 === 0 ? `${kg}` : `${kg.toFixed(1)}`;
  }
  return amount.toString();
}
