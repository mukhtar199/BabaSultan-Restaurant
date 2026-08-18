import React, { useState } from 'react';
import { Recipe } from '../../../domain/entities/recipe';
import { recipeDict, RecipeLang } from './translations';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, PieChart, RefreshCw } from 'lucide-react';

interface RecipeCostCalculatorViewProps {
  recipes: Recipe[];
  lang: RecipeLang;
}

export const RecipeCostCalculatorView: React.FC<RecipeCostCalculatorViewProps> = ({
  recipes,
  lang
}) => {
  const t = recipeDict[lang] || recipeDict.en;

  const [selectedRecipeId, setSelectedRecipeId] = useState(recipes[0]?.id || '');
  const activeRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0];

  const [simulatedPrice, setSimulatedPrice] = useState<number>(activeRecipe?.sellingPrice || 12);
  const [simulatedCostMultiplier, setSimulatedCostMultiplier] = useState<number>(100); // 100% = normal cost

  // Recalculate based on simulation inputs
  const originalCost = activeRecipe?.totalCost || 3.5;
  const simulatedCost = originalCost * (simulatedCostMultiplier / 100);
  const foodCostPct = simulatedPrice > 0 ? (simulatedCost / simulatedPrice) * 100 : 0;
  const grossProfit = simulatedPrice - simulatedCost;
  const grossMargin = simulatedPrice > 0 ? (grossProfit / simulatedPrice) * 100 : 0;

  const handleSelectRecipe = (id: string) => {
    setSelectedRecipeId(id);
    const rec = recipes.find((r) => r.id === id);
    if (rec) {
      setSimulatedPrice(rec.sellingPrice || 12);
      setSimulatedCostMultiplier(100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          {t.calculator.title}
        </h2>
        <p className="text-xs text-slate-400">{t.calculator.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Select Recipe to Simulate</label>
            <select
              value={selectedRecipeId}
              onChange={(e) => handleSelectRecipe(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.recipeName} (${r.sellingPrice?.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {activeRecipe && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-300">{t.calculator.simulatedPrice}:</span>
                  <span className="text-amber-400 font-mono text-sm">${simulatedPrice.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={simulatedPrice}
                  onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-300">Ingredient Cost Inflation / Change:</span>
                  <span className="text-emerald-400 font-mono text-sm">{simulatedCostMultiplier}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={simulatedCostMultiplier}
                  onChange={(e) => setSimulatedCostMultiplier(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  100% = Standard Cost (${originalCost.toFixed(2)}). Higher % simulates supplier price inflation.
                </p>
              </div>

              <button
                onClick={() => {
                  setSimulatedPrice(activeRecipe.sellingPrice || 12);
                  setSimulatedCostMultiplier(100);
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Simulator
              </button>
            </div>
          )}
        </div>

        {/* Results Visualizer Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{activeRecipe?.recipeName}</h3>
                <p className="text-xs text-slate-400">Linked to {activeRecipe?.productName}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono ${
                  foodCostPct <= 30
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : foodCostPct <= 35
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {foodCostPct.toFixed(1)}% Food Cost
              </span>
            </div>

            {/* Metric Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <p className="text-xs text-slate-400 font-bold">Simulated Cost / Portion</p>
                <p className="text-xl font-black text-amber-400 font-mono">${simulatedCost.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">Original: ${originalCost.toFixed(2)}</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <p className="text-xs text-slate-400 font-bold">Gross Profit / Portion</p>
                <p className="text-xl font-black text-emerald-400 font-mono">${grossProfit.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">Margin: {grossMargin.toFixed(1)}%</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <p className="text-xs text-slate-400 font-bold">Estimated Profit for 100 Meals</p>
                <p className="text-xl font-black text-white font-mono">${(grossProfit * 100).toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">Revenue: ${(simulatedPrice * 100).toFixed(2)}</p>
              </div>
            </div>

            {/* Visual Profit Bar Breakdown */}
            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Revenue Breakdown:</span>
                <span>${simulatedPrice.toFixed(2)} Total</span>
              </div>

              <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${Math.min(100, foodCostPct)}%` }}
                  className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-black text-slate-950"
                  title="Ingredient Cost"
                >
                  {foodCostPct > 15 && `${foodCostPct.toFixed(0)}% Cost`}
                </div>
                <div
                  style={{ width: `${Math.max(0, 100 - foodCostPct)}%` }}
                  className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-black text-slate-950"
                  title="Gross Profit"
                >
                  {(100 - foodCostPct) > 15 && `${(100 - foodCostPct).toFixed(0)}% Profit`}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3 mt-6">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Profitability Tip:</strong> If ingredient inflation pushes Food Cost above 35%, consider raising the selling price to ${((simulatedCost / 0.30)).toFixed(2)} to keep your food cost target at 30%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
