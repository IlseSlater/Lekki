import { strict as assert } from "node:assert";
import { test } from "node:test";
import { EventBusService } from "./event-bus.service";

function envelope(eventId: string) {
  return { eventId, eventName: "TransactionCreated" } as never;
}

test("Batch 3: a failed handler leaves the event undelivered so the retry re-runs it", async () => {
  const bus = new EventBusService();
  let calls = 0;
  bus.subscribe(() => {
    calls += 1;
    if (calls === 1) throw new Error("socket down");
  });

  await assert.rejects(() => bus.publish(envelope("evt-1")));
  assert.equal(calls, 1);

  // The outbox retries the same eventId. Before this fix the bus had already
  // marked it seen, returned silently, and the publisher recorded publishedAt.
  await bus.publish(envelope("evt-1"));
  assert.equal(calls, 2);
});

test("Batch 3: a delivered event is not published twice", async () => {
  const bus = new EventBusService();
  let calls = 0;
  bus.subscribe(() => {
    calls += 1;
  });

  await bus.publish(envelope("evt-2"));
  await bus.publish(envelope("evt-2"));
  assert.equal(calls, 1);
});

test("Batch 3: every subscriber receives the envelope", async () => {
  const bus = new EventBusService();
  const seen: string[] = [];
  bus.subscribe(() => void seen.push("a"));
  bus.subscribe(() => void seen.push("b"));

  await bus.publish(envelope("evt-3"));
  assert.deepEqual(seen, ["a", "b"]);
});
