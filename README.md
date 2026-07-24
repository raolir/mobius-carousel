# mobius-carousel

A React Three Fiber carousel in the shape of a Möbius strip with accompanying WordPress plugin

## Development demo

```bash
pnpm dev
```

The demo is served from `http://localhost:5173/mobius-carousel/` and deployed to
<https://raolir.github.io/mobius-carousel/>.

The demo build is separate from the WordPress plugin build:

```bash
pnpm build:demo
pnpm build
```

- `pnpm build:demo` writes the standalone demo to `dist/`.
- `pnpm build` writes only WordPress plugin assets to `wordpress-plugin/dist/`.

Build the installable WordPress plugin archive with:

```bash
pnpm package
```

The archive is written to `releases/mobius-carousel.zip`.
