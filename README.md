# Prosper

Automate things the way you think about them.

Prosper is an experiment about intelligence emerging from a connected memory: stimuli are memorized as nodes of a
graph, linked to the nodes that were active when they occurred. Nodes are activated when input and decay over time,
already-crossed links make concepts emerge, and predictions are the successors of currently active nodes.

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

Memories saved by the previous (Angular/sigma v1) version can still be loaded.
