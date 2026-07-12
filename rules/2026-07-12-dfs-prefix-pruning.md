# DFS solver needs prefix pruning for large dictionaries

## Symptom
`generatePlayableGrid()` and `findHintWord()` hung for >2 minutes when using the real 172k-word Enable1 dictionary. The DFS explores every possible path on the grid with no early termination.

## Failed approaches
- Relying on `MAX_SOLVER_DEPTH = 8` alone — still exponential: 8^16 possible paths per tile
- Checking only `isValidWord(current)` — too late; the path is already fully explored

## Fix
Build a prefix set from the dictionary (`getPrefixSet()` in `dictionary.ts`) and check `prefixSet.has(current.toLowerCase())` at each DFS step. If no dictionary word starts with the current prefix, prune that branch immediately. Combined with the depth cap (8 letters), the solver finishes in <100ms.

Also fix the uppercase/lowercase mismatch: the grid generates UPPERCASE letters (`'A'`, `'B'`) but the dictionary/prefix set is LOWERCASE. Always `.toLowerCase()` when checking the prefix set against grid-derived words.

## Signal
If a DFS over a large dictionary is slow, check for prefix pruning. The enable1.txt list (172k words) is the baseline — without pruning it's unusable.
