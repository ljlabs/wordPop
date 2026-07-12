# TypeScript 6: `let` variable narrows to `never` in nested closures

## Symptom
Inside a DFS/recursion function, a `let bestHint: HintResult | null = null` gets narrowed to `never` in subsequent checks (`if (bestHint && bestHint.word.length > ...)`) with `TS2339: Property 'word' does not exist on type 'never'`.

## Failed approaches
- `let bestHint: HintResult | null = null` — narrowed to `never` in closure
- `let bestHint = null as HintResult | null` — same issue

## Fix
Use a mutable wrapper object to prevent TypeScript 6 from narrowing through nested closures:

```typescript
const best = { hint: null as HintResult | null };
// Inside DFS: best.hint = { ... }
// After DFS: return best.hint;
```

## Signal
TypeScript 6 is stricter about control flow narrowing in nested function scopes. If you see `never` on a variable that should be nullable, wrap it in an object.
