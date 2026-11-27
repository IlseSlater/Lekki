import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CART_MAX_AGE_MS,
  cartKey,
  clearCart,
  loadCart,
  newOrderKey,
  saveCart,
  smallImageUrl,
  type CartStorage,
} from './cart-store';

function fakeStorage(): CartStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const burger = {
  catalogueItemId: 'c1',
  label: 'Burger',
  quantity: 2,
  unitPrice: 85,
  routingTags: ['kitchen'],
  imageUrl: '/assets/burger.jpg',
};

test('a saved cart comes back with the same order key after a reload', () => {
  const s = fakeStorage();
  saveCart(s, 'sess1', [burger], 'key-1', 1000);
  const back = loadCart(s, 'sess1', 2000);
  assert.equal(back?.orderKey, 'key-1');
  assert.equal(back?.lines[0]?.quantity, 2);
  assert.equal(back?.lines[0]?.imageUrl, '/assets/burger.jpg');
});

test('carts are per visit', () => {
  const s = fakeStorage();
  saveCart(s, 'sess1', [burger], 'k', 1000);
  assert.equal(loadCart(s, 'sess2', 1000), null);
});

test('an empty cart clears the stored one', () => {
  const s = fakeStorage();
  saveCart(s, 'sess1', [burger], 'k', 1000);
  saveCart(s, 'sess1', [], 'k', 1100);
  assert.equal(s.data.has(cartKey('sess1')), false);
  saveCart(s, 'sess1', [burger], 'k', 1200);
  clearCart(s, 'sess1');
  assert.equal(loadCart(s, 'sess1', 1300), null);
});

test('an old cart is dropped', () => {
  const s = fakeStorage();
  saveCart(s, 'sess1', [burger], 'k', 1000);
  assert.equal(loadCart(s, 'sess1', 1000 + CART_MAX_AGE_MS + 1), null);
  assert.equal(s.data.has(cartKey('sess1')), false);
});

test('images stay small: links only, never image data', () => {
  assert.equal(smallImageUrl('data:image/png;base64,AAAA'), undefined);
  assert.equal(smallImageUrl('https://cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg');
  assert.equal(smallImageUrl('/assets/a.jpg'), '/assets/a.jpg');
  assert.equal(smallImageUrl('x'.repeat(600)), undefined);
  const s = fakeStorage();
  saveCart(s, 'sess1', [{ ...burger, imageUrl: 'data:image/png;base64,AAAA' }], 'k', 1000);
  assert.equal(loadCart(s, 'sess1', 1000)?.lines[0]?.imageUrl, undefined);
});

test('damaged or hostile storage never throws', () => {
  const s = fakeStorage();
  s.setItem(cartKey('sess1'), '{not json');
  assert.equal(loadCart(s, 'sess1'), null);
  s.setItem(
    cartKey('sess1'),
    JSON.stringify({
      savedAt: Date.now(),
      lines: [{ catalogueItemId: 'c1', quantity: -4, unitPrice: 5 }, { quantity: 1 }, 'x'],
    }),
  );
  assert.equal(loadCart(s, 'sess1'), null);
});

test('a blocked or full storage keeps the cart working in memory', () => {
  const blocked: CartStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => undefined,
  };
  assert.equal(saveCart(blocked, 'sess1', [burger], 'k'), null);
});

test('order keys are unique and plain', () => {
  const a = newOrderKey();
  const b = newOrderKey();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]{8,80}$/);
});
