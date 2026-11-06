/**
 * InventorySystem.js
 * Core business logic — all values read from settings, never hardcoded.
 */

class Item {
  constructor(name, price) {
    this.name     = name;
    this.price    = price;
    this.usedCups = 0;
  }
  get total() { return this.usedCups * this.price; }
}

class InventorySystem {
  constructor(cfg) {
    // cfg comes from getSettings()
    const p = cfg?.prices || {};
    this.M  = new Item("Medium",        p.M  ?? 29);
    this.L  = new Item("Large",         p.L  ?? 39);
    this.S  = new Item("Small",         p.S  ?? 25);
    this.MC = new Item("Iced Coffee M", p.MC ?? 35);
    this.LC = new Item("Iced Coffee L", p.LC ?? 45);
    this.HC = new Item("Hot Coffee",    p.HC ?? 45);

    this.salaryBase           = cfg?.salaryBase           ?? 350;
    this.salaryBonusThreshold = cfg?.salaryBonusThreshold ?? 3000;
    this.salaryBonusPerK      = cfg?.salaryBonusPerK      ?? 50;

    this.extras       = [];   // Fruit Tea + products you added, priced as sold

    this.expensesList = [];
    this.expenses     = 0;
    this.addons       = 0;
  }

  setCupsM(begin, end, tallyMC)  { this.M.usedCups  = (begin - end) - tallyMC; }
  setCupsL(begin, end, tallyLC)  { this.L.usedCups  = (begin - end) - tallyLC; }
  setCupsS(begin, end)           { this.S.usedCups  = (begin - end); }
  setCupsHC(begin, end)          { this.HC.usedCups = (begin - end); }
  setMC(tally)                   { this.MC.usedCups = tally; }
  setLC(tally)                   { this.LC.usedCups = tally; }

  // Cup stock is one pool per cup size:  beg + delivered - out = end   (M, L, S, HC).
  // Every product sold from a cup comes out of that pool. Where it shows on the receipt:
  //   - same cup AND same price as an existing row  -> it stays on that row
  //     (Fruit Tea M at the Medium price is simply part of the Medium row)
  //   - different price                              -> it gets its own row, and its cups
  //     are taken out of the cup row they came from so nothing is counted twice
  // list: [{ name, cup, qty, total, price? }]  (price defaults to total / qty)
  setExtras(list) {
    this.extras = [];
    const plain  = { M: this.M, L: this.L, S: this.S, HC: this.HC };
    const coffee = { M: this.MC, L: this.LC };
    (list || []).forEach(e => {
      const qty = Number(e.qty) || 0;
      if (!qty) return;
      const price = e.price != null ? Number(e.price) : e.total / qty;
      const base  = e.cup ? plain[e.cup] : null;
      if (base && Math.abs(base.price - price) < 0.005) return;                 // stays on M / L / S / HC row
      const cof = e.cup ? coffee[e.cup] : null;
      if (cof && Math.abs(cof.price - price) < 0.005) {                          // same as the iced coffee row
        cof.usedCups += qty; base.usedCups -= qty; return;
      }
      const it = new Item(e.name, price);                                        // own row
      it.usedCups = qty;
      this.extras.push(it);
      if (base) base.usedCups -= qty;
    });
  }

  setExpenses(list) {
    this.expensesList = list;
    this.expenses     = list.reduce((s, i) => s + i.price, 0);
  }
  setAddons(amount) { this.addons = amount; }

  computeTotalCupSale() {
    return this.M.total + this.L.total + this.S.total +
           this.MC.total + this.LC.total + this.HC.total +
           this.extras.reduce((t, e) => t + e.total, 0);
  }

  computeSalaryBonus(totalSales) {
    // No salary if cup sales don't even cover the base wage
    if (totalSales < this.salaryBase) return 0;
    let salary = this.salaryBase;
    if (totalSales >= this.salaryBonusThreshold) {
      salary += this.salaryBonusPerK;
      salary += Math.floor((totalSales - this.salaryBonusThreshold) / 1000) * this.salaryBonusPerK;
    }
    return salary;
  }

  computeGrossIncome(salary) {
    return this.computeTotalCupSale() - (this.expenses + salary);
  }

  computeFinalTotal(salary) {
    return this.computeGrossIncome(salary) + this.addons;
  }
}
