# Orduva Patch Ver-0.044 — mobile popup padding and product view polish

## What changed

### 1. Version bump
- Live version updated to `Ver: 0.044`

### 2. Customer-facing product popup
- Reworked the popup layout to feel cleaner and more balanced
- Removed the internal/dev-style content block from the popup
- Simplified the content so it reads like a customer-facing product view
- Added equal outer padding on mobile top and bottom
- Centered the popup properly on mobile
- Improved desktop spacing and button padding
- Kept the image, description, price, and add-to-order flow clear and tidy

### 3. Admin add new product popup
- Changed add product from an inline form into a proper popup/modal
- Added equal mobile outer padding top and bottom
- Centered the popup on mobile
- Improved desktop layout and spacing
- Improved footer/button spacing and padding
- Kept the form simple and cleaner to use

### 4. Admin edit product popup
- Improved mobile outer padding so it no longer sits off-screen at the top
- Centered the popup on mobile
- Improved desktop layout spacing and footer/button padding
- Kept the edit form more balanced and easier to scan

## Main files changed
- `components/menu/ProductCard.tsx`
- `components/admin/ProductManager.tsx`
- `lib/version.ts`

## Notes
- The add product flow is now a popup instead of an inline panel.
- I was not able to complete a clean container build verification because dependency install/build tooling was not available cleanly in this copied patch folder at the end of the session.
- This patch should be live-tested after deploy, especially:
  - customer product popup on mobile
  - add product popup on mobile
  - edit product popup on mobile
  - button spacing on desktop

