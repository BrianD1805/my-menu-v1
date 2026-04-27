// Keep the root route fallback silent so the storefront does not flash a large
// loading panel during ordinary section/page navigation. Customer-data areas
// now show their own focused loading messages only when they are actually
// opening account/profile/order information.
export default function StorefrontLoading() {
  return null;
}
