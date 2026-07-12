# Zustand selector stability: never pass the whole store as a useEffect dependency

## Symptom
`Maximum update depth exceeded` infinite loop when clicking Play. The stack trace pointed to `session.start()` inside a `useEffect`.

## Failed approaches
- `const session = useGameSessionStore()` — returns a new object reference on every state change, causing infinite re-renders
- Putting `session` in a `useEffect` dependency array triggers the effect on every state update

## Fix
Select stable action references from Zustand using individual selectors:

```typescript
// BAD: entire store changes on every state update
const session = useGameSessionStore();
useEffect(() => { session.start(size); }, [session, size]);

// GOOD: selectors return referentially stable values
const start = useGameSessionStore((s) => s.start);
const gridSize = useAppStore((s) => s.gridSize);
useEffect(() => { start(gridSize); }, [start, gridSize]);
```

Zustand guarantees that selector results are referentially stable when the selected value doesn't change. Actions defined in the store creator are the same function reference across renders.

## Signal
If you see `Maximum update depth exceeded` in a useEffect, check whether you're selecting the entire store object rather than individual stable values.
