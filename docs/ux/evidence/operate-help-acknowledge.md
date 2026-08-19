# Help call polish — Acknowledge → Resolve

**When:** 2026-08-07  
**Source:** Restaurant App waiter calls (Acknowledge / Resolve)

## Flow

| Step | Waiter | Guest |
|------|--------|-------|
| Call | Help badge · **Acknowledge ›** | *Waiter notified — hang tight* |
| Ack | Status **On the way** · **Resolve ›** | *Your waiter is on the way* (live) |
| Resolve | Cleared | *Help resolved — you’re all set* |

One open call per session. API: `POST /assistance/:id/acknowledge` · event `AssistanceAcknowledged`.
