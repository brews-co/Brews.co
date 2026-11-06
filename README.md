# BREWS.CO

Inventory, point of sale and daily reports for a milk tea and coffee shop. Static web app
(HTML, CSS, vanilla JS), installable as a PWA, works offline.

Android app: see [ANDROID.md](ANDROID.md).

## Pages

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Splash, shift status, today's totals, cloud sync |
| Calculate | `calculate.html` | Cup counts, sales, salary and final total |
| Shift (POS) | `pos.html` | Orders, receipts, end of shift |
| History | `calendar.html` | Calendar, monthly summary, order logs |
| Settings | `settings.html` | Products, flavors, add-ons, pay, appearance, sync key, backup |

## Code layout

```
css/styles.css        all styles, fonts declared at the top
fonts/                bundled fonts (OFL)
vendor/               Firebase SDK + html2canvas (bundled, see THIRD_PARTY_NOTICES.md)
js/util.js            shared helpers: esc, fmt, localDate, readJSON, safeColor, safeImg
js/theme.js           accent color and background photo (per device)
js/appstyle.js        font and text size (per device)
js/nav.js header.js layout.js   shared header and bottom nav, filled from data-* attributes
js/settings.js        shop settings with defaults (prices, add-ons, salary, flavors)
js/menu.js            products: built-in + added, order, editor, flavor lists, menu manager
js/sync.js            Firestore push / pull with merge by date and sync key
js/InventorySystem.js calculation model
js/storage.js history.js ui.js main.js calc-page.js     Calculate page
js/pos.js             Shift (POS) page
js/calendar.js        History page
js/home.js            Home page
js/settings-page.js   Settings page
service-worker.js     offline cache (bump CACHE_NAME every release)
```

## How products work

- Built-in products (M, L, MC, LC, HC, S, FTM, FTL) can be renamed, repriced, recolored,
  hidden or reordered.
- You can add products. Each one picks a cup (Small, Medium, Large, Hot, or none) and a
  flavor list: a shared list, its own list, or none. Cups come out of the right cup count
  and the sales show on their own rows in Calculate.
- Flavor lists live in `settings.flavors`. A product's own list is keyed by its code.

## Cups and receipt rows

Cup stock is one pool per cup size (M, L, S, HC): `beg + delivered - out = end`.
On the receipt a product shares a row with an existing one when it uses the **same cup and the
same price** (Fruit Tea M at the Medium price is part of the Medium row). A different price gets
its own row, and its cups are taken out of the cup row they came from.

## Orders

- Not done: qty can change and add-ons can be added (never removed once on the order).
- Done: locked. Use **Refund** for a cup or an add-on. Cash cup refunds show as an auto
  expense, add-on refunds reduce Add-ons, and online (GCash) orders never touch the cash count.

## Menu colors

Each tile has a tile color and a font color (Auto picks black/white). Save colors to
**My colors** in the product editor; the palette syncs with the menu.

## Releasing

1. Bump `CACHE_NAME` in `service-worker.js`.
2. Add any new file to the lists in `service-worker.js`.
3. Deploy the folder as is (GitHub Pages works).

## Cloud sync setup

1. Create a Firestore database and publish `firestore.rules`.
2. On one device: Settings → Cloud Sync → Generate, then Push from Home.
3. On the other devices: enter the same key, then Pull.

## License

Proprietary, see `LICENSE`. Third-party components keep their own licenses.
