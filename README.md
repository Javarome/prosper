# Prosper

Automate things the way you think about them.

Prosper is an experiment about intelligence emerging from a connected memory:

- stimuli are memorized as nodes of a graph, linked to the nodes that were active when they occurred;
- like neurons, the memory has no notion of time: recency only shows through activation levels, which decay at each
  tick, so links from the most recently perceived (most active) nodes are stronger than links from older context;
- crossing a link again reinforces it (like a furrow getting deeper), and makes a concept emerge from its two ends;
- a perceived node is activated, and spreads part of its activation to its neighbors, proportionally to the links
  weights; all activations decay at each input;
- predictions are the successors of active nodes, weighted by their activation and by the links weights.

## Structure

- `src/engine`: the Prosper engine, in plain TypeScript, built on a [graphology](https://graphology.github.io/) graph.
  It has no UI dependency and can run in Node as well as in a browser.
- `src/ui`: vanilla web components (`<prosper-app>`, `<prosper-input>`, `<prosper-output>`, `<prosper-graph>`).
  The graph is rendered with [sigma.js](https://www.sigmajs.org/) and laid out with ForceAtlas2.

## Development

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm test           # engine unit tests (Vitest)
npm run build      # type-check and production build in dist/
```

Each push on `master` is tested, built and deployed to [javarome.com/prosper](https://javarome.com/prosper/) by
GitHub Actions (`.github/workflows/pages.yml`).

Memories saved by the previous (Angular/sigma v1) version can still be loaded.
