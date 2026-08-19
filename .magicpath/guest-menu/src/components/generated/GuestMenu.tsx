import { useMemo, useState } from "react";

type CatalogueItem = {
  id: string;
  label: string;
  category: string;
  unitPrice: number;
  description: string;
};

type CartLine = {
  catalogueItemId: string;
  label: string;
  quantity: number;
  unitPrice: number;
};

type Phase = "browse" | "item" | "cart";

const CATALOGUE: CatalogueItem[] = [
  {
    id: "m1",
    label: "Wood-fired Margherita",
    category: "Mains",
    unitPrice: 145,
    description: "San Marzano · basil · fior di latte",
  },
  {
    id: "m2",
    label: "Crispy calamari",
    category: "Starters",
    unitPrice: 95,
    description: "Lemon · aioli",
  },
  {
    id: "m3",
    label: "Seasonal garden salad",
    category: "Starters",
    unitPrice: 78,
    description: "Local greens · soft herbs",
  },
  {
    id: "m4",
    label: "Grilled line fish",
    category: "Mains",
    unitPrice: 210,
    description: "Butter · capers · new potatoes",
  },
  {
    id: "m5",
    label: "Chocolate fondant",
    category: "Desserts",
    unitPrice: 85,
    description: "Warm centre · vanilla ice cream",
  },
  {
    id: "m6",
    label: "Espresso",
    category: "Drinks",
    unitPrice: 32,
    description: "Single or double",
  },
];

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

/**
 * LEOS Guest browse → item → cart (from apps/web guest.page.ts).
 */
export const GuestMenu = () => {
  const [phase, setPhase] = useState<Phase>("browse");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<CatalogueItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(CATALOGUE.map((i) => i.category))),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATALOGUE.filter((i) => {
      if (categoryFilter && i.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        i.label.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });
  }, [search, categoryFilter]);

  const cartCount = cart.reduce((n, l) => n + l.quantity, 0);
  const cartTotal = cart.reduce((n, l) => n + l.quantity * l.unitPrice, 0);

  const purpose =
    phase === "item"
      ? selected?.label ?? "Item"
      : phase === "cart"
        ? "Your order"
        : "Menu";

  const lead =
    phase === "browse"
      ? "Table T12 · Restaurant"
      : phase === "item"
        ? selected?.description ?? ""
        : cart.length
          ? "Check quantities — then send it through."
          : "Pick something from the menu — it only takes a tap.";

  const openItem = (item: CatalogueItem) => {
    setSelected(item);
    setQuantity(1);
    setPhase("item");
    setMessage("");
  };

  const addToCart = () => {
    if (!selected) return;
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.catalogueItemId === selected.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          catalogueItemId: selected.id,
          label: selected.label,
          quantity,
          unitPrice: selected.unitPrice,
        },
      ];
    });
    setMessage(`Added ${quantity}× ${selected.label}`);
    setPhase("browse");
  };

  const setLineQty = (index: number, qty: number) => {
    setCart((prev) => {
      if (qty < 1) return prev.filter((_, i) => i !== index);
      const next = [...prev];
      next[index] = { ...next[index], quantity: qty };
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--leos-warm-sand)] px-4 py-6 font-[family-name:var(--leos-font-sans)] text-[var(--leos-neutral-dark)]">
      <article className="w-full max-w-md flex flex-col gap-6">
        <header>
          <p className="mb-3 text-[0.6875rem] font-bold tracking-[0.14em] uppercase text-[var(--leos-emerald)]">
            LEOS
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[var(--leos-warm-sand-dark)] pb-3">
            <span className="rounded-full bg-[var(--leos-emerald-soft)] px-3 py-1 text-xs font-semibold text-[var(--leos-emerald)]">
              Restaurant
            </span>
            <span className="text-sm">
              Place <strong>T12</strong>
            </span>
            <span className="text-sm text-[var(--leos-neutral-muted)]">Hi, Alex</span>
          </div>
          <h1 className="m-0 text-[1.75rem] font-semibold leading-tight">{purpose}</h1>
          {lead ? (
            <p className="mt-2 mb-0 text-base leading-relaxed text-[var(--leos-neutral-muted)]">
              {lead}
            </p>
          ) : null}
        </header>

        <div className="rounded-[24px] border border-[var(--leos-warm-sand-dark)] bg-[var(--leos-surface-ambient)] p-5 shadow-[var(--leos-shadow-card)]">
          {phase === "browse" ? (
            <div>
              <label className="mb-4 flex flex-col gap-2" role="search">
                <span className="text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
                  Search
                </span>
                <input
                  className="min-h-11 w-full rounded-xl border border-[var(--leos-warm-sand-dark)] bg-white px-4 py-3 text-base focus:border-[var(--leos-emerald)] focus:outline-none focus:shadow-[0_0_0_3px_var(--leos-emerald-soft)]"
                  value={search}
                  placeholder="Find something…"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              <div className="mb-4 flex flex-wrap gap-2" role="toolbar" aria-label="Categories">
                <button
                  type="button"
                  className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm transition ${
                    !categoryFilter
                      ? "border-[var(--leos-emerald)] bg-[var(--leos-emerald-soft)] font-semibold text-[var(--leos-emerald)]"
                      : "border-[var(--leos-warm-sand-dark)] bg-white"
                  }`}
                  onClick={() => setCategoryFilter("")}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`min-h-11 rounded-full border px-3.5 py-1.5 text-sm transition ${
                      categoryFilter === cat
                        ? "border-[var(--leos-emerald)] bg-[var(--leos-emerald-soft)] font-semibold text-[var(--leos-emerald)]"
                        : "border-[var(--leos-warm-sand-dark)] bg-white"
                    }`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid gap-3">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded-2xl border border-[var(--leos-warm-sand-dark)] bg-white p-4 text-left transition hover:border-[var(--leos-warm-sand-focus)] hover:shadow-[var(--leos-shadow-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--leos-emerald)]"
                    onClick={() => openItem(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="m-0 font-semibold">{item.label}</p>
                        <p className="mt-1 mb-0 text-sm text-[var(--leos-neutral-muted)]">
                          {item.description}
                        </p>
                        <p className="mt-2 mb-0 text-xs uppercase tracking-wide text-[var(--leos-neutral-subtle)]">
                          {item.category}
                        </p>
                      </div>
                      <p className="m-0 shrink-0 font-semibold">{zar(item.unitPrice)}</p>
                    </div>
                  </button>
                ))}
                {!filtered.length ? (
                  <div className="py-6 text-center">
                    <p className="m-0 text-[var(--leos-neutral-muted)]">Nothing matches that.</p>
                    <p className="mt-2 mb-0 text-[var(--leos-neutral-muted)]">
                      Try another category or clear search.
                    </p>
                    <button
                      type="button"
                      className="mt-4 text-sm font-semibold text-[var(--leos-emerald)]"
                      onClick={() => {
                        setSearch("");
                        setCategoryFilter("");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : null}
              </div>

              {cart.length ? (
                <button
                  type="button"
                  className="mt-5 flex w-full min-h-12 items-center justify-between rounded-xl bg-[var(--leos-emerald)] px-4 py-3 text-white transition hover:bg-[var(--leos-emerald-dark)]"
                  onClick={() => setPhase("cart")}
                >
                  <span className="font-semibold">
                    {cartCount} item{cartCount === 1 ? "" : "s"}
                  </span>
                  <span className="font-semibold">{zar(cartTotal)} · View order</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {phase === "item" && selected ? (
            <div>
              <p className="m-0 text-[var(--leos-neutral-muted)]">{selected.description}</p>
              <p className="mt-4 mb-0 text-[1.25rem] font-semibold">{zar(selected.unitPrice)}</p>
              <div className="mt-6">
                <span className="text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
                  Quantity
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--leos-warm-sand-dark)] bg-white text-lg font-semibold"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-lg font-semibold" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--leos-warm-sand-dark)] bg-white text-lg font-semibold"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {phase === "cart" ? (
            <div>
              {!cart.length ? (
                <div className="py-4 text-center">
                  <p className="m-0 text-[var(--leos-neutral-muted)]">Your order is empty.</p>
                  <p className="mt-2 mb-0 text-[var(--leos-neutral-muted)]">
                    Pick something from the menu — it only takes a tap.
                  </p>
                </div>
              ) : (
                <div role="list" aria-label="Cart lines" className="flex flex-col gap-3">
                  {cart.map((line, index) => (
                    <div
                      key={`${line.catalogueItemId}-${index}`}
                      role="listitem"
                      className="flex items-center justify-between gap-3 border-b border-[var(--leos-warm-sand-dark)] pb-3"
                    >
                      <div>
                        <p className="m-0 font-semibold">{line.label}</p>
                        <p className="mt-1 mb-0 text-sm text-[var(--leos-neutral-muted)]">
                          {zar(line.unitPrice)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--leos-warm-sand-dark)] bg-white"
                          onClick={() => setLineQty(index, line.quantity - 1)}
                          aria-label={`Decrease ${line.label}`}
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center font-semibold">{line.quantity}</span>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--leos-warm-sand-dark)] bg-white"
                          onClick={() => setLineQty(index, line.quantity + 1)}
                          aria-label={`Increase ${line.label}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 text-lg font-semibold">
                    <span>Total</span>
                    <span>{zar(cartTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {message ? (
            <p
              className="mt-4 rounded-xl bg-[var(--leos-success-bg)] px-3 py-2 text-sm text-[var(--leos-success)]"
              role="status"
            >
              {message}
            </p>
          ) : null}
        </div>

        {phase === "item" ? (
          <footer className="flex justify-between gap-3 border-t border-[var(--leos-warm-sand-dark)] pt-6">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--leos-warm-sand-dark)] bg-transparent px-5 py-3 text-[0.9375rem] font-semibold"
              onClick={() => setPhase("browse")}
            >
              Back
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--leos-emerald)] px-6 py-3 text-[0.9375rem] font-semibold text-white hover:bg-[var(--leos-emerald-dark)] active:scale-[0.98]"
              onClick={addToCart}
            >
              Add to order
            </button>
          </footer>
        ) : null}

        {phase === "cart" ? (
          <footer className="flex justify-between gap-3 border-t border-[var(--leos-warm-sand-dark)] pt-6">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--leos-warm-sand-dark)] bg-transparent px-5 py-3 text-[0.9375rem] font-semibold"
              onClick={() => setPhase("browse")}
            >
              Keep browsing
            </button>
            {cart.length ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--leos-emerald)] px-6 py-3 text-[0.9375rem] font-semibold text-white hover:bg-[var(--leos-emerald-dark)] active:scale-[0.98]"
                onClick={() => {
                  setMessage("Order sent — the kitchen can see it.");
                  setCart([]);
                  setPhase("browse");
                }}
              >
                Send order
              </button>
            ) : null}
          </footer>
        ) : null}
      </article>
    </div>
  );
};
