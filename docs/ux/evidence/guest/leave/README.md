# Evidence — G-08 / G-09 Leave

**Uncertainty removed:** Am I done?

| Case | Evidence |
|------|----------|
| Clear done state | Receipt purpose + leave copy |
| Leave closes session | `POST /sessions/:id/close` · e2e |
| Context freed | Heartbeat e2e “PhysicalContext free” |

Leave is production-path green for Restaurant; Guest UX polish: Pack terminology on receipt + close CTA (`physicalContext` / `close` / `participant`).
