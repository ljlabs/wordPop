# TypeScript 6: useRef() requires a default argument

## Symptom
`useRef<ReturnType<typeof setTimeout>>()` gives `TS2554: Expected 1 arguments, but got 0` in TypeScript 6.

## Failed approaches
- `useRef<ReturnType<typeof setTimeout>>()` — TS6 error
- `useRef<ReturnType<typeof setTimeout>>(null)` — works but is misleading for timers
- `useRef<ReturnType<typeof setTimeout>>(undefined)` — correct for mutable timer refs

## Fix
Always pass a default argument to `useRef()`:
- Timer refs: `useRef<ReturnType<typeof setTimeout>>(undefined)`
- Element refs: `useRef<HTMLDivElement>(null)`
- Mutable state refs: `useRef<boolean>(false)`

## Signal
If you see `TS2554: Expected 1 arguments` on a `useRef` call, you're missing the default argument.
