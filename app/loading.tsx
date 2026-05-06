export default function AppLoading() {
  // Keep route transitions quiet. The premium "We're getting things ready"
  // loader is handled by the storefront client loader only during first store
  // startup/open, not throughout account/logout/app navigation.
  return <div aria-hidden="true" className="min-h-screen bg-[#F8F4F0]" />;
}
