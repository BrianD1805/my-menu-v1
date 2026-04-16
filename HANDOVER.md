# Orduva Ver-0.047 Handover

This patch rebuilds the popup UI work cleanly on top of the confirmed working Ver-0.046 baseline.

## Included in this patch
- bumped visible live version to `Ver: 0.047`
- rebuilt the customer-facing product details popup with cleaner customer copy
- removed the heavier/internal-feeling product detail presentation
- improved mobile popup centering and outer padding for the customer product popup
- improved mobile popup centering and outer padding for the admin add/edit product popups
- increased desktop button/footer padding for both admin add/edit popups and the customer popup

## Main files changed
- `components/menu/ProductCard.tsx`
- `components/admin/ProductManager.tsx`
- `lib/version.ts`

## Notes
- This patch was intentionally kept limited to popup UI work on top of the deployed Ver-0.046 baseline.
- I was not able to complete a local `npm run build` in the container because the extracted patch did not have a working local dependency install available, so please verify on Netlify after deploy.

## Deploy
```bash
git add .
git commit -m "Orduva Ver-0.047 popup mobile padding and customer view cleanup"
git push origin main
```

If Git says nothing changed:
```bash
git commit --allow-empty -m "Orduva Ver-0.047 popup mobile padding and customer view cleanup"
git push origin main
```
