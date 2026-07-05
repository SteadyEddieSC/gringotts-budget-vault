# GitHub + Cloudflare Pages setup

1. Confirm the repository contains `index.html` at the root.
2. In Cloudflare, choose Workers & Pages → Create application → Pages → Connect to Git.
3. Pick `SteadyEddieSC/gringotts-budget-vault`.
4. Use static settings:
   - Framework preset: None / Static
   - Build command: blank
   - Output directory: `/`
   - Production branch: `main`
5. Do not use the Worker deploy command `npx wrangler deploy` for this PWA.
6. After deploy, open the `*.pages.dev` URL on Android Chrome and choose Install/Add to Home screen.
