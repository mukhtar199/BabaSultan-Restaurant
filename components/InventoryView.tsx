import React, { useState } from 'react';
import { Product, Ingredient, InventoryMovement } from '../types';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, PlusCircle } from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  ingredients: Ingredient[];
  movements: InventoryMovement[];
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  onRecordMovement: (data: any) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  ingredients,
  movements,
  onUpdateStock,
  onRecordMovement
}) => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'products' | 'movements'>('ingredients');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  const lowIngredients = ingredients.filter(i => i.stock <= i.minStockAlert);
  const lowProducts = products.filter(p => p.stock <= p.minStockAlert);

  const handleStockSave = async (pId: string) => {
    await onUpdateStock(pId, newStockVal);
    setEditingProductId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            Kitchen Inventory & Menu Dishes
          </h2>
          <p className="text-xs text-slate-400">
            Real-time stock monitoring & threshold notifications
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
              activeTab === 'ingredients' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kitchen Raw Ingredients ({ingredients.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
              activeTab === 'products' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Menu Dishes ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
              activeTab === 'movements' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Movement Log ({movements.length})
          </button>
        </div>
      </div>

      {/* Low Stock Warning Header */}
      {(lowIngredients.length > 0 || lowProducts.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            <strong>Stock Alert:</strong> {lowIngredients.map(i => i.name).join(', ')} running low! Reorder required.
          </p>
        </div>
      )}

      {/* Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Ingredient Name</th>
                  <th className="py-4 px-6">Current Stock</th>
                  <th className="py-4 px-6">Alert Level</th>
                  <th className="py-4 px-6">Cost / Unit</th>
                  <th className="py-4 px-6">Supplier</th>
                  <th className="py-4 px-6">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ingredients.map(ing => {
                  const isLow = ing.stock <= ing.minStockAlert;
                  return (
                    <tr key={ing.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-semibold text-white">{ing.name}</td>
                      <td className="py-4 px-6 font-bold text-slate-200">
                        {ing.stock} {ing.unit}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{ing.minStockAlert} {ing.unit}</td>
                      <td className="py-4 px-6">${ing.costPerUnit.toFixed(2)}</td>
                      <td className="py-4 px-6 text-xs text-slate-300">{ing.supplierName}</td>
                      <td className="py-4 px-6">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                            Sufficient
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Menu Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Dish Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Selling Price</th>
                  <th className="py-4 px-6">Dish Cost</th>
                  <th className="py-4 px-6">Available Stock</th>
                  <th className="py-4 px-6">Sales Count</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{p.name}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{p.category}</td>
                    <td className="py-4 px-6 font-bold text-emerald-400">${p.price.toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-400">${p.cost.toFixed(2)}</td>
                    <td className="py-4 px-6 font-bold text-white">
                      {editingProductId === p.id ? (
                        <input
                          type="number"
                          value={newStockVal}
                          onChange={e => setNewStockVal(parseInt(e.target.value) || 0)}
                          className="w-20 bg-slate-950 border border-emerald-500 rounded px-2 py-1 text-sm text-white"
                        />
                      ) : (
                        `${p.stock} ${p.unit}`
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-300">{p.salesCount} sold</td>
                    <td className="py-4 px-6 text-right">
                      {editingProductId === p.id ? (
                        <button
                          onClick={() => handleStockSave(p.id)}
                          className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded text-xs"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingProductId(p.id);
                            setNewStockVal(p.stock);
                          }}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Adjust Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movements Log Tab */}
      {activeTab === 'movements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Item Name</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Reason / Reference</th>
                  <th className="py-4 px-6">Created By</th>
                  <th className="py-4 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{m.itemName}</td>
                    <td className="py-4 px-6 text-xs">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                        m.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {m.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{m.quantity}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{m.reason}</td>
                    <td className="py-4 px-6 text-xs text-slate-300">{m.createdBy}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
