# Tests

- `unit/`: Vitest suites, grouped by the source module they cover.
- `node/`: Node runtime tests (`pnpm test:uploads`).
- `*.browser.spec.ts` and `fixtures/`: Playwright browser tests.
- `verification/`: manual integration and browser verification scripts.
- `python/`: WordPress migration reader tests.

Run from the project root:

```sh
pnpm test
pnpm test:uploads
pnpm exec playwright test --config playwright.studio.config.ts ticker-interaction
python -m unittest discover -s tests/python
```

Manual verification scripts retain their original behavior and environment requirements. Some create temporary records or change settings: use a local test database, inspect the script first, and do not run them against production. The ticker fixture tests need no database or app server.

Docker excludes this directory and test runner configuration. Its final runtime stage copies compiled application output, production dependencies, public assets, templates, and the upload server—not test sources or fixtures.
