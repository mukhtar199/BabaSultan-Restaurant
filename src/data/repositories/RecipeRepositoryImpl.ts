import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, COLLECTIONS, recordInventoryMovementFirestore } from '../../lib/firebase';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import {
  Recipe,
  RecipeItem,
  RecipeVersionHistory,
  Ingredient,
  IngredientMovement,
  UnitConversion,
  StockCount,
  WasteRecord,
  ConsumptionStat,
  IngredientForecast,
  FoodCostDashboardData
} from '../../domain/entities/recipe';
import { UnitConversionEngine } from '../../lib/unitConversionEngine';

// Phase 16 Collections
const RECIPES_COLL = 'recipes';
const RECIPE_VERSIONS_COLL = 'recipe_versions';
const INGREDIENTS_COLL = 'ingredients';
const INGREDIENT_MOVEMENTS_COLL = 'ingredient_movements';
const UNIT_CONVERSIONS_COLL = 'unit_conversions';
const STOCK_COUNTS_COLL = 'stock_counts';
const WASTE_RECORDS_COLL = 'waste_records';

export class RecipeRepositoryImpl implements IRecipeRepository {
  // ==========================================
  // RECIPES
  // ==========================================
  async fetchRecipes(): Promise<Recipe[]> {
    try {
      const q = query(collection(db, RECIPES_COLL), orderBy('productName', 'asc'));
      const snap = await getDocs(q);
      const list: Recipe[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Recipe));
      return list;
    } catch (err: any) {
      console.warn('Note fetching recipes:', err?.message || err);
      return [];
    }
  }

  subscribeRecipes(callback: (recipes: Recipe[]) => void): () => void {
    const q = query(collection(db, RECIPES_COLL), orderBy('productName', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const list: Recipe[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Recipe));
        callback(list);
      },
      (err) => {
        console.warn('Note subscribing recipes:', err?.message || err);
      }
    );
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const ref = doc(db, RECIPES_COLL, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Recipe;
      }
      return null;
    } catch {
      return null;
    }
  }

  async getRecipeByProductId(productId: string): Promise<Recipe | null> {
    try {
      const q = query(collection(db, RECIPES_COLL), where('productId', '==', productId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Recipe;
      }
      return null;
    } catch {
      return null;
    }
  }

  async createRecipe(recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    const ref = doc(collection(db, RECIPES_COLL));
    const now = new Date().toISOString();

    const newRecipe: Recipe = {
      ...recipeData,
      id: ref.id,
      version: recipeData.version || 1,
      isActive: recipeData.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(ref, newRecipe);

    // Record Initial Version History
    await addDoc(collection(db, RECIPE_VERSIONS_COLL), {
      recipeId: ref.id,
      productId: recipeData.productId,
      productName: recipeData.productName,
      version: newRecipe.version,
      items: recipeData.items,
      totalCost: recipeData.totalCost,
      foodCostPercentage: recipeData.foodCostPercentage,
      sellingPrice: recipeData.sellingPrice,
      changedBy: recipeData.createdBy || 'System Admin',
      changeReason: 'Initial Recipe Creation',
      createdAt: now
    });

    return newRecipe;
  }

  async updateRecipe(
    id: string,
    recipeData: Partial<Recipe>,
    changeReason?: string,
    changedBy?: string
  ): Promise<void> {
    const ref = doc(db, RECIPES_COLL, id);
    const existing = await this.getRecipeById(id);
    const now = new Date().toISOString();

    const newVersion = (existing?.version || 1) + 1;
    const updates = {
      ...recipeData,
      version: newVersion,
      updatedAt: now
    };

    await updateDoc(ref, updates);

    // Save Version History
    if (existing) {
      await addDoc(collection(db, RECIPE_VERSIONS_COLL), {
        recipeId: id,
        productId: recipeData.productId || existing.productId,
        productName: recipeData.productName || existing.productName,
        version: newVersion,
        items: recipeData.items || existing.items,
        totalCost: recipeData.totalCost ?? existing.totalCost,
        foodCostPercentage: recipeData.foodCostPercentage ?? existing.foodCostPercentage,
        sellingPrice: recipeData.sellingPrice ?? existing.sellingPrice,
        changedBy: changedBy || 'Admin',
        changeReason: changeReason || `Updated to version ${newVersion}`,
        createdAt: now
      });
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    await deleteDoc(doc(db, RECIPES_COLL, id));
  }

  async fetchRecipeHistory(recipeId: string): Promise<RecipeVersionHistory[]> {
    try {
      const q = query(
        collection(db, RECIPE_VERSIONS_COLL),
        where('recipeId', '==', recipeId)
      );
      const snap = await getDocs(q);
      const list: RecipeVersionHistory[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as RecipeVersionHistory));
      return list.sort((a, b) => b.version - a.version);
    } catch {
      return [];
    }
  }

  // ==========================================
  // INGREDIENTS
  // ==========================================
  async fetchIngredients(): Promise<Ingredient[]> {
    try {
      const q = query(collection(db, INGREDIENTS_COLL), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      const list: Ingredient[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Ingredient));
      return list;
    } catch {
      return [];
    }
  }

  subscribeIngredients(callback: (ingredients: Ingredient[]) => void): () => void {
    const q = query(collection(db, INGREDIENTS_COLL), orderBy('name', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const list: Ingredient[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Ingredient));
        callback(list);
      },
      (err) => console.warn('Note subscribing ingredients:', err?.message || err)
    );
  }

  async createIngredient(
    ingredientData: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Ingredient> {
    const ref = doc(collection(db, INGREDIENTS_COLL));
    const now = new Date().toISOString();

    const costPerUsageUnit = ingredientData.conversionFactor > 0
      ? ingredientData.purchaseCost / ingredientData.conversionFactor
      : ingredientData.purchaseCost;

    const status =
      ingredientData.currentStockUsageUnit <= 0
        ? 'out_of_stock'
        : ingredientData.currentStockUsageUnit <= ingredientData.minStockUsageUnit
        ? 'low_stock'
        : 'in_stock';

    const newIng: Ingredient = {
      ...ingredientData,
      id: ref.id,
      costPerUsageUnit,
      status,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(ref, newIng);

    // Record initial movement log
    if (ingredientData.currentStockUsageUnit > 0) {
      await recordInventoryMovementFirestore({
        type: 'in',
        itemType: 'ingredient',
        itemId: ref.id,
        itemName: newIng.name,
        quantity: newIng.currentStockUsageUnit,
        reason: 'Initial Ingredient Stocking',
        createdBy: 'Admin'
      });
    }

    return newIng;
  }

  async updateIngredient(id: string, ingredientData: Partial<Ingredient>): Promise<void> {
    const ref = doc(db, INGREDIENTS_COLL, id);
    const now = new Date().toISOString();

    const updates: any = { ...ingredientData, updatedAt: now };

    // Recalculate cost per usage unit if purchaseCost or conversionFactor updated
    if (ingredientData.purchaseCost !== undefined || ingredientData.conversionFactor !== undefined) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const cur = snap.data();
        const pCost = ingredientData.purchaseCost ?? cur.purchaseCost;
        const cFactor = ingredientData.conversionFactor ?? cur.conversionFactor;
        updates.costPerUsageUnit = cFactor > 0 ? pCost / cFactor : pCost;
      }
    }

    // Recalculate status if stock updated
    if (ingredientData.currentStockUsageUnit !== undefined) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const cur = snap.data();
        const minStock = ingredientData.minStockUsageUnit ?? cur.minStockUsageUnit ?? 10;
        updates.status =
          ingredientData.currentStockUsageUnit <= 0
            ? 'out_of_stock'
            : ingredientData.currentStockUsageUnit <= minStock
            ? 'low_stock'
            : 'in_stock';
      }
    }

    await updateDoc(ref, updates);

    // If purchase cost changed, auto-recalculate recipes that use this ingredient!
    if (ingredientData.purchaseCost !== undefined || updates.costPerUsageUnit !== undefined) {
      this.recalculateRecipeCostsForIngredient(id, updates.costPerUsageUnit);
    }
  }

  async deleteIngredient(id: string): Promise<void> {
    await deleteDoc(doc(db, INGREDIENTS_COLL, id));
  }

  private async recalculateRecipeCostsForIngredient(ingredientId: string, newCostPerUsageUnit: number) {
    try {
      const recipes = await this.fetchRecipes();
      for (const recipe of recipes) {
        let updated = false;
        const newItems = recipe.items.map((item) => {
          if (item.ingredientId === ingredientId) {
            updated = true;
            const costPerUnit = newCostPerUsageUnit;
            const totalCost = item.quantity * costPerUnit;
            return { ...item, costPerUnit, totalCost };
          }
          return item;
        });

        if (updated) {
          const totalCost = newItems.reduce((sum, i) => sum + i.totalCost, 0);
          const costPerPortion = recipe.yieldQuantity > 0 ? totalCost / recipe.yieldQuantity : totalCost;
          const foodCostPercentage = recipe.sellingPrice > 0 ? (costPerPortion / recipe.sellingPrice) * 100 : 0;
          const grossProfit = recipe.sellingPrice - costPerPortion;
          const grossProfitMargin = recipe.sellingPrice > 0 ? (grossProfit / recipe.sellingPrice) * 100 : 0;

          await updateDoc(doc(db, RECIPES_COLL, recipe.id), {
            items: newItems,
            totalCost,
            costPerPortion,
            foodCostPercentage,
            grossProfit,
            grossProfitMargin,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.warn('Note recalculating recipes for ingredient:', err);
    }
  }

  // ==========================================
  // INGREDIENT MOVEMENTS & AUTO DEDUCTION
  // ==========================================
  async fetchIngredientMovements(ingredientId?: string): Promise<IngredientMovement[]> {
    try {
      let q = query(collection(db, INGREDIENT_MOVEMENTS_COLL), orderBy('createdAt', 'desc'));
      if (ingredientId) {
        q = query(
          collection(db, INGREDIENT_MOVEMENTS_COLL),
          where('ingredientId', '==', ingredientId),
          orderBy('createdAt', 'desc')
        );
      }
      const snap = await getDocs(q);
      const list: IngredientMovement[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as IngredientMovement));
      return list;
    } catch {
      return [];
    }
  }

  subscribeIngredientMovements(callback: (movements: IngredientMovement[]) => void): () => void {
    const q = query(collection(db, INGREDIENT_MOVEMENTS_COLL), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const list: IngredientMovement[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as IngredientMovement));
        callback(list);
      },
      (err) => console.warn('Note subscribing movements:', err?.message || err)
    );
  }

  /**
   * AUTOMATIC INVENTORY DEDUCTION ENGINE
   * Called when an order is completed. For each order item, finds its recipe and deducts all ingredients from stock.
   */
  async deductRecipeIngredientsForOrder(
    orderItems: Array<{ productId: string; productName: string; quantity: number }>,
    orderNumber: string,
    createdBy: string
  ): Promise<void> {
    try {
      const customConversions = await this.fetchUnitConversions();
      const now = new Date().toISOString();

      for (const orderItem of orderItems) {
        const recipe = await this.getRecipeByProductId(orderItem.productId);
        if (!recipe || !recipe.items || recipe.items.length === 0) continue;

        for (const recipeItem of recipe.items) {
          const ingRef = doc(db, INGREDIENTS_COLL, recipeItem.ingredientId);
          const ingSnap = await getDoc(ingRef);

          if (!ingSnap.exists()) continue;
          const ingData = ingSnap.data() as Ingredient;

          // Quantity required per order = recipeItem.quantity * orderItem.quantity
          const recipeQuantityTotal = recipeItem.quantity * orderItem.quantity;

          // Convert recipe quantity unit to ingredient usageUnit if different
          const deductedInUsageUnit = UnitConversionEngine.convert(
            recipeQuantityTotal,
            recipeItem.unit,
            ingData.usageUnit,
            customConversions,
            ingData.id
          );

          const previousStock = ingData.currentStockUsageUnit || 0;
          const newStock = Math.max(0, previousStock - deductedInUsageUnit);

          const status =
            newStock <= 0
              ? 'out_of_stock'
              : newStock <= ingData.minStockUsageUnit
              ? 'low_stock'
              : 'in_stock';

          // Update Ingredient Stock
          await updateDoc(ingRef, {
            currentStockUsageUnit: newStock,
            status,
            updatedAt: now
          });

          // Log Ingredient Movement
          await recordInventoryMovementFirestore({
            type: 'out',
            itemType: 'ingredient',
            itemId: ingData.id,
            itemName: ingData.name,
            quantity: deductedInUsageUnit,
            reason: `Auto-deduction for ${orderItem.quantity}x ${orderItem.productName} (Order #${orderNumber})`,
            createdBy: createdBy || 'POS System'
          });
        }
      }
    } catch (err) {
      console.warn('Note during automatic ingredient deduction:', err);
    }
  }

  // ==========================================
  // UNIT CONVERSIONS
  // ==========================================
  async fetchUnitConversions(): Promise<UnitConversion[]> {
    try {
      const snap = await getDocs(collection(db, UNIT_CONVERSIONS_COLL));
      const list: UnitConversion[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as UnitConversion));
      return list;
    } catch {
      return [];
    }
  }

  subscribeUnitConversions(callback: (conversions: UnitConversion[]) => void): () => void {
    return onSnapshot(
      collection(db, UNIT_CONVERSIONS_COLL),
      (snap) => {
        const list: UnitConversion[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as UnitConversion));
        callback(list);
      },
      (err) => console.warn('Note subscribing unit conversions:', err?.message || err)
    );
  }

  async createUnitConversion(
    data: Omit<UnitConversion, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UnitConversion> {
    const ref = doc(collection(db, UNIT_CONVERSIONS_COLL));
    const now = new Date().toISOString();
    const newConv: UnitConversion = {
      ...data,
      id: ref.id,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(ref, newConv);
    return newConv;
  }

  async deleteUnitConversion(id: string): Promise<void> {
    await deleteDoc(doc(db, UNIT_CONVERSIONS_COLL, id));
  }

  // ==========================================
  // STOCK COUNTING
  // ==========================================
  async fetchStockCounts(): Promise<StockCount[]> {
    try {
      const q = query(collection(db, STOCK_COUNTS_COLL), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: StockCount[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StockCount));
      return list;
    } catch {
      return [];
    }
  }

  async createStockCount(data: Omit<StockCount, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockCount> {
    const ref = doc(collection(db, STOCK_COUNTS_COLL));
    const now = new Date().toISOString();

    const countNumber = `STK-${Math.floor(10000 + Math.random() * 90000)}`;
    const newCount: StockCount = {
      ...data,
      id: ref.id,
      countNumber: data.countNumber || countNumber,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(ref, newCount);
    return newCount;
  }

  async applyStockCountAdjustment(stockCountId: string, user: string): Promise<void> {
    const ref = doc(db, STOCK_COUNTS_COLL, stockCountId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const countData = snap.data() as StockCount;
    const now = new Date().toISOString();

    for (const item of countData.items) {
      if (item.difference !== 0) {
        const ingRef = doc(db, INGREDIENTS_COLL, item.ingredientId);
        const ingSnap = await getDoc(ingRef);
        if (ingSnap.exists()) {
          const ingData = ingSnap.data() as Ingredient;
          const previousStock = ingData.currentStockUsageUnit || 0;
          const newStock = item.actualQuantity;

          const status =
            newStock <= 0
              ? 'out_of_stock'
              : newStock <= ingData.minStockUsageUnit
              ? 'low_stock'
              : 'in_stock';

          await updateDoc(ingRef, {
            currentStockUsageUnit: newStock,
            status,
            updatedAt: now
          });

          await recordInventoryMovementFirestore({
            type: 'adjustment',
            itemType: 'ingredient',
            itemId: ingData.id,
            itemName: ingData.name,
            quantity: Math.abs(item.difference),
            reason: `Physical Stock Count Adjustment (${item.difference > 0 ? '+' : ''}${item.difference} ${item.unit})`,
            createdBy: user
          });
        }
      }
    }

    await updateDoc(ref, {
      status: 'adjusted',
      updatedAt: now
    });
  }

  // ==========================================
  // WASTE MANAGEMENT
  // ==========================================
  async fetchWasteRecords(): Promise<WasteRecord[]> {
    try {
      const q = query(collection(db, WASTE_RECORDS_COLL), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: WasteRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as WasteRecord));
      return list;
    } catch {
      return [];
    }
  }

  subscribeWasteRecords(callback: (records: WasteRecord[]) => void): () => void {
    const q = query(collection(db, WASTE_RECORDS_COLL), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const list: WasteRecord[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as WasteRecord));
        callback(list);
      },
      (err) => console.warn('Note subscribing waste records:', err?.message || err)
    );
  }

  async recordWaste(data: Omit<WasteRecord, 'id' | 'createdAt'>): Promise<WasteRecord> {
    const ref = doc(collection(db, WASTE_RECORDS_COLL));
    const now = new Date().toISOString();

    const record: WasteRecord = {
      ...data,
      id: ref.id,
      createdAt: now
    };

    await setDoc(ref, record);

    // Deduct stock from ingredient
    const ingRef = doc(db, INGREDIENTS_COLL, data.ingredientId);
    const ingSnap = await getDoc(ingRef);
    if (ingSnap.exists()) {
      const ingData = ingSnap.data() as Ingredient;
      const previousStock = ingData.currentStockUsageUnit || 0;
      const newStock = Math.max(0, previousStock - data.quantity);

      const status =
        newStock <= 0
          ? 'out_of_stock'
          : newStock <= ingData.minStockUsageUnit
          ? 'low_stock'
          : 'in_stock';

      await updateDoc(ingRef, {
        currentStockUsageUnit: newStock,
        status,
        updatedAt: now
      });

      await recordInventoryMovementFirestore({
        type: 'out',
        itemType: 'ingredient',
        itemId: ingData.id,
        itemName: ingData.name,
        quantity: data.quantity,
        reason: `Waste Recorded: ${(data.reason || 'waste').replace('_', ' ').toUpperCase()} - ${data.notes || ''}`,
        createdBy: data.recordedBy || 'Kitchen'
      });
    }

    return record;
  }

  // ==========================================
  // ANALYTICS & FORECASTING
  // ==========================================
  async getConsumptionAnalytics(): Promise<ConsumptionStat[]> {
    const ingredients = await this.fetchIngredients();
    const movements = await this.fetchIngredientMovements();

    const statsMap: Record<string, ConsumptionStat> = {};

    ingredients.forEach((ing) => {
      statsMap[ing.id] = {
        ingredientId: ing.id,
        ingredientName: ing.name,
        unit: ing.usageUnit,
        totalQuantityUsed: 0,
        totalCost: 0,
        averageDailyUsage: 0,
        averageMonthlyUsage: 0,
        movementCount: 0,
        movementType: 'moderate'
      };
    });

    movements.forEach((m) => {
      if ((m.type === 'order_deduction' || m.type === 'waste') && m.quantity < 0) {
        const ingId = m.ingredientId;
        if (statsMap[ingId]) {
          const used = Math.abs(m.quantity);
          statsMap[ingId].totalQuantityUsed += used;
          statsMap[ingId].totalCost += m.cost || 0;
          statsMap[ingId].movementCount += 1;
        }
      }
    });

    return Object.values(statsMap).map((s) => {
      const avgDaily = Number((s.totalQuantityUsed / 30).toFixed(2));
      const avgMonthly = Number(s.totalQuantityUsed.toFixed(2));
      const movementType =
        avgDaily > 500 ? 'fast' : avgDaily < 50 ? 'slow' : 'moderate';

      return {
        ...s,
        averageDailyUsage: avgDaily,
        averageMonthlyUsage: avgMonthly,
        movementType
      };
    });
  }

  async getIngredientForecasts(): Promise<IngredientForecast[]> {
    const ingredients = await this.fetchIngredients();
    const analytics = await this.getConsumptionAnalytics();
    const analyticsMap = new Map(analytics.map((a) => [a.ingredientId, a]));

    return ingredients.map((ing) => {
      const stat = analyticsMap.get(ing.id);
      const avgDaily = stat && stat.averageDailyUsage > 0 ? stat.averageDailyUsage : 10;
      const currentStock = ing.currentStockUsageUnit || 0;

      const daysRemaining = Math.max(0, Math.floor(currentStock / avgDaily));
      const expected30Days = Number((avgDaily * 30).toFixed(2));
      const suggestedReorder = Math.max(0, expected30Days - currentStock + ing.minStockUsageUnit);

      let reorderStatus: IngredientForecast['reorderStatus'] = 'normal';
      let purchaseRecommendation = 'Stock level is healthy.';

      if (daysRemaining <= 3) {
        reorderStatus = 'urgent';
        purchaseRecommendation = `URGENT: Reorder at least ${suggestedReorder} ${ing.usageUnit} immediately! Only ${daysRemaining} days remaining.`;
      } else if (daysRemaining <= 7) {
        reorderStatus = 'warning';
        purchaseRecommendation = `WARNING: Reorder ${suggestedReorder} ${ing.usageUnit} soon. Stock covers ${daysRemaining} days.`;
      } else if (daysRemaining > 60) {
        reorderStatus = 'overstocked';
        purchaseRecommendation = 'Stock level high. Reduce upcoming purchase orders.';
      }

      return {
        ingredientId: ing.id,
        ingredientName: ing.name,
        currentStock,
        unit: ing.usageUnit,
        averageDailyUsage: avgDaily,
        daysRemaining,
        suggestedReorderQuantity: Math.ceil(suggestedReorder),
        expectedConsumptionNext30Days: expected30Days,
        reorderStatus,
        purchaseRecommendation
      };
    });
  }

  async getFoodCostDashboardData(): Promise<FoodCostDashboardData> {
    const recipes = await this.fetchRecipes();
    const wasteRecords = await this.fetchWasteRecords();
    const ingredients = await this.fetchIngredients();

    const totalRecipesCount = recipes.length;
    const avgFc =
      recipes.length > 0
        ? recipes.reduce((sum, r) => sum + r.foodCostPercentage, 0) / recipes.length
        : 0;

    let highest: { name: string; foodCostPercentage: number } | null = null;
    let lowest: { name: string; foodCostPercentage: number } | null = null;

    recipes.forEach((r) => {
      if (!highest || r.foodCostPercentage > highest.foodCostPercentage) {
        highest = { name: r.productName, foodCostPercentage: r.foodCostPercentage };
      }
      if (!lowest || r.foodCostPercentage < lowest.foodCostPercentage) {
        lowest = { name: r.productName, foodCostPercentage: r.foodCostPercentage };
      }
    });

    const totalWasteCost = wasteRecords.reduce((sum, w) => sum + w.totalCost, 0);

    const totalInventoryValuation = ingredients.reduce((sum, ing) => {
      return sum + (ing.currentStockUsageUnit * ing.costPerUsageUnit);
    }, 0);

    const totalWastePercentage =
      totalInventoryValuation > 0
        ? Number(((totalWasteCost / totalInventoryValuation) * 100).toFixed(2))
        : 0;

    return {
      totalRecipesCount,
      averageFoodCostPercentage: Number(avgFc.toFixed(2)),
      highestCostRecipe: highest,
      lowestCostRecipe: lowest,
      totalWasteCost: Number(totalWasteCost.toFixed(2)),
      totalWastePercentage,
      totalInventoryValuation: Number(totalInventoryValuation.toFixed(2))
    };
  }

  // ==========================================
  // INITIAL SEEDING
  // ==========================================
  async seedInitialRecipesAndIngredients(): Promise<void> {
    const ingredients = await this.fetchIngredients();
    if (ingredients.length > 0) return; // Already seeded

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // 1. Seed Ingredients with Purchase Unit vs Usage Unit
    const sampleIngredients: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        code: 'ING-BEEF-01',
        name: 'Fresh Ground Beef Patty',
        nameEn: 'Fresh Ground Beef Patty',
        nameAr: 'لحم بقر مفروم طازج',
        nameSo: 'Hilib Lo\'ad oo shiidan',
        category: 'Meat',
        purchaseUnit: 'kg',
        usageUnit: 'g',
        conversionFactor: 1000, // 1 kg = 1000 g
        currentStockUsageUnit: 25000, // 25 kg = 25000 g
        minStockUsageUnit: 5000,
        purchaseCost: 12.00, // $12 per kg
        costPerUsageUnit: 0.012, // $0.012 per g
        supplierName: 'Mogadishu Central Meats',
        status: 'in_stock'
      },
      {
        code: 'ING-BREAD-01',
        name: 'Artisan Sesame Burger Buns',
        nameEn: 'Artisan Sesame Burger Buns',
        nameAr: 'خبز برجر بالسمسم',
        nameSo: 'Bunka Burgerka oo Simsim leh',
        category: 'Bakery',
        purchaseUnit: 'box',
        usageUnit: 'pcs',
        conversionFactor: 24, // 1 box = 24 pcs
        currentStockUsageUnit: 240, // 10 boxes = 240 pcs
        minStockUsageUnit: 48,
        purchaseCost: 12.00, // $12 per box
        costPerUsageUnit: 0.50, // $0.50 per bun
        supplierName: 'Somali Bakery Co',
        status: 'in_stock'
      },
      {
        code: 'ING-CHEESE-01',
        name: 'Cheddar Cheese Slices',
        nameEn: 'Cheddar Cheese Slices',
        nameAr: 'شرائح جبن شيدر',
        nameSo: 'Jiis Cheddar ah',
        category: 'Dairy',
        purchaseUnit: 'kg',
        usageUnit: 'g',
        conversionFactor: 1000,
        currentStockUsageUnit: 10000, // 10 kg
        minStockUsageUnit: 2000,
        purchaseCost: 15.00, // $15 per kg
        costPerUsageUnit: 0.015, // $0.015 per g
        supplierName: 'Dairy Gold',
        status: 'in_stock'
      },
      {
        code: 'ING-SAUCE-01',
        name: 'House Special Sauce',
        nameEn: 'House Special Sauce',
        nameAr: 'صلصة المنزل الخاصة',
        nameSo: 'Sosuha Gaarka ah',
        category: 'Liquids',
        purchaseUnit: 'L',
        usageUnit: 'ml',
        conversionFactor: 1000,
        currentStockUsageUnit: 15000, // 15 Liters = 15000 ml
        minStockUsageUnit: 3000,
        purchaseCost: 8.00, // $8 per Liter
        costPerUsageUnit: 0.008, // $0.008 per ml
        supplierName: 'Global Flavors',
        status: 'in_stock'
      },
      {
        code: 'ING-LETTUCE-01',
        name: 'Fresh Iceberg Lettuce',
        nameEn: 'Fresh Iceberg Lettuce',
        nameAr: 'خس آيسبرغ طازج',
        nameSo: 'Khas Fershi ah',
        category: 'Produce',
        purchaseUnit: 'kg',
        usageUnit: 'g',
        conversionFactor: 1000,
        currentStockUsageUnit: 12000, // 12 kg
        minStockUsageUnit: 2000,
        purchaseCost: 4.00, // $4 per kg
        costPerUsageUnit: 0.004,
        supplierName: 'Fresh Farms Produce',
        status: 'in_stock'
      },
      {
        code: 'ING-TOMATO-01',
        name: 'Fresh Red Tomatoes',
        nameEn: 'Fresh Red Tomatoes',
        nameAr: 'طماطم حمراء طازجة',
        nameSo: 'Tanyaamo Fershi ah',
        category: 'Produce',
        purchaseUnit: 'kg',
        usageUnit: 'g',
        conversionFactor: 1000,
        currentStockUsageUnit: 15000, // 15 kg
        minStockUsageUnit: 3000,
        purchaseCost: 3.00, // $3 per kg
        costPerUsageUnit: 0.003,
        supplierName: 'Fresh Farms Produce',
        status: 'in_stock'
      },
      {
        code: 'ING-ONION-01',
        name: 'Fresh Red Onions',
        nameEn: 'Fresh Red Onions',
        nameAr: 'بصل أحمر طازج',
        nameSo: 'Basal Fershi ah',
        category: 'Produce',
        purchaseUnit: 'kg',
        usageUnit: 'g',
        conversionFactor: 1000,
        currentStockUsageUnit: 20000, // 20 kg
        minStockUsageUnit: 4000,
        purchaseCost: 2.50, // $2.50 per kg
        costPerUsageUnit: 0.0025,
        supplierName: 'Fresh Farms Produce',
        status: 'in_stock'
      }
    ];

    const createdIngs: Ingredient[] = [];
    for (const ing of sampleIngredients) {
      const ingRef = doc(collection(db, INGREDIENTS_COLL));
      const newIng: Ingredient = {
        ...ing,
        id: ingRef.id,
        createdAt: now,
        updatedAt: now
      };
      batch.set(ingRef, newIng);
      createdIngs.push(newIng);
    }

    await batch.commit();

    // 2. Create Burger Recipe with exact specified ingredients:
    // Beef = 150 g, Bread = 1 Piece, Cheese = 20 g, Sauce = 15 ml, Lettuce = 30 g, Tomato = 40 g, Onion = 20 g
    const beefIng = createdIngs.find((i) => i.code === 'ING-BEEF-01');
    const breadIng = createdIngs.find((i) => i.code === 'ING-BREAD-01');
    const cheeseIng = createdIngs.find((i) => i.code === 'ING-CHEESE-01');
    const sauceIng = createdIngs.find((i) => i.code === 'ING-SAUCE-01');
    const lettuceIng = createdIngs.find((i) => i.code === 'ING-LETTUCE-01');
    const tomatoIng = createdIngs.find((i) => i.code === 'ING-TOMATO-01');
    const onionIng = createdIngs.find((i) => i.code === 'ING-ONION-01');

    if (beefIng && breadIng && cheeseIng && sauceIng && lettuceIng && tomatoIng && onionIng) {
      const burgerItems: RecipeItem[] = [
        {
          id: 'item_1',
          ingredientId: beefIng.id,
          ingredientName: beefIng.name,
          quantity: 150,
          unit: 'g',
          costPerUnit: beefIng.costPerUsageUnit,
          totalCost: 150 * beefIng.costPerUsageUnit // 150 * 0.012 = 1.80
        },
        {
          id: 'item_2',
          ingredientId: breadIng.id,
          ingredientName: breadIng.name,
          quantity: 1,
          unit: 'pcs',
          costPerUnit: breadIng.costPerUsageUnit,
          totalCost: 1 * breadIng.costPerUsageUnit // 1 * 0.50 = 0.50
        },
        {
          id: 'item_3',
          ingredientId: cheeseIng.id,
          ingredientName: cheeseIng.name,
          quantity: 20,
          unit: 'g',
          costPerUnit: cheeseIng.costPerUsageUnit,
          totalCost: 20 * cheeseIng.costPerUsageUnit // 20 * 0.015 = 0.30
        },
        {
          id: 'item_4',
          ingredientId: sauceIng.id,
          ingredientName: sauceIng.name,
          quantity: 15,
          unit: 'ml',
          costPerUnit: sauceIng.costPerUsageUnit,
          totalCost: 15 * sauceIng.costPerUsageUnit // 15 * 0.008 = 0.12
        },
        {
          id: 'item_5',
          ingredientId: lettuceIng.id,
          ingredientName: lettuceIng.name,
          quantity: 30,
          unit: 'g',
          costPerUnit: lettuceIng.costPerUsageUnit,
          totalCost: 30 * lettuceIng.costPerUsageUnit // 30 * 0.004 = 0.12
        },
        {
          id: 'item_6',
          ingredientId: tomatoIng.id,
          ingredientName: tomatoIng.name,
          quantity: 40,
          unit: 'g',
          costPerUnit: tomatoIng.costPerUsageUnit,
          totalCost: 40 * tomatoIng.costPerUsageUnit // 40 * 0.003 = 0.12
        },
        {
          id: 'item_7',
          ingredientId: onionIng.id,
          ingredientName: onionIng.name,
          quantity: 20,
          unit: 'g',
          costPerUnit: onionIng.costPerUsageUnit,
          totalCost: 20 * onionIng.costPerUsageUnit // 20 * 0.0025 = 0.05
        }
      ];

      const totalCost = burgerItems.reduce((sum, i) => sum + i.totalCost, 0); // 3.01
      const sellingPrice = 12.00;
      const foodCostPercentage = Number(((totalCost / sellingPrice) * 100).toFixed(2));
      const grossProfit = Number((sellingPrice - totalCost).toFixed(2));
      const grossProfitMargin = Number(((grossProfit / sellingPrice) * 100).toFixed(2));

      await this.createRecipe({
        productId: 'prod_burger_spec',
        productName: 'Classic House Cheeseburger',
        productCategory: 'Burgers & Sandwiches',
        recipeName: 'Standard Gourmet Cheeseburger Recipe',
        version: 1,
        items: burgerItems,
        yieldQuantity: 1,
        totalCost,
        costPerPortion: totalCost,
        sellingPrice,
        foodCostPercentage,
        grossProfit,
        grossProfitMargin,
        netProfit: grossProfit * 0.85,
        isActive: true,
        createdBy: 'Master Chef'
      });
    }

    // 3. Seed Custom Unit Conversions
    const sampleConversions: Omit<UnitConversion, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { fromUnit: 'kg', toUnit: 'g', factor: 1000, description: '1 Kilogram = 1000 Grams' },
      { fromUnit: 'L', toUnit: 'ml', factor: 1000, description: '1 Liter = 1000 Milliliters' },
      { fromUnit: 'box', toUnit: 'pcs', factor: 24, description: '1 Box = 24 Pieces' },
      { fromUnit: 'carton', toUnit: 'pcs', factor: 12, description: '1 Carton = 12 Pieces' },
      { fromUnit: 'tray', toUnit: 'pcs', factor: 30, description: '1 Egg Tray = 30 Eggs' }
    ];

    for (const conv of sampleConversions) {
      await this.createUnitConversion(conv);
    }
  }
}
