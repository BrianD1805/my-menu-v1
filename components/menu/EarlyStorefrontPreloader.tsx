export default function EarlyStorefrontPreloader() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #orduva-early-preloader {
              position: fixed;
              inset: 0;
              z-index: 2147483000;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px;
              --orduva-preloader-accent: #ff6a3d;
              --orduva-preloader-accent-soft: rgba(255,106,61,0.18);
              --orduva-preloader-accent-faint: rgba(255,106,61,0.10);
              --orduva-preloader-label: #b74a16;
              background:
                radial-gradient(circle at 18% 8%, var(--orduva-preloader-accent-soft), transparent 34%),
                radial-gradient(circle at 82% 18%, var(--orduva-preloader-accent-faint), transparent 34%),
                linear-gradient(135deg, #fff7f0 0%, #f5f2ee 54%, #fffaf4 100%);
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
              opacity: 1;
              visibility: visible;
              transition: opacity 220ms ease, visibility 220ms ease;
            }
            html.orduva-early-preloader-done #orduva-early-preloader {
              opacity: 0;
              visibility: hidden;
              pointer-events: none;
            }
            #orduva-early-preloader .orduva-early-card {
              width: min(320px, 92vw);
              text-align: center;
            }
            #orduva-early-preloader .orduva-early-mark {
              position: relative;
              width: 78px;
              height: 78px;
              margin: 0 auto;
              border-radius: 999px;
              background: rgba(255,255,255,0.82);
              border: 1px solid var(--orduva-preloader-accent-soft);
              box-shadow: 0 22px 58px rgba(15,23,42,0.14);
            }
            #orduva-early-preloader .orduva-early-mark::before,
            #orduva-early-preloader .orduva-early-mark::after {
              content: "";
              position: absolute;
              inset: 15px;
              border-radius: 999px;
            }
            #orduva-early-preloader .orduva-early-mark::before {
              border: 4px solid var(--orduva-preloader-accent-faint);
            }
            #orduva-early-preloader .orduva-early-mark::after {
              border: 4px solid transparent;
              border-top-color: var(--orduva-preloader-accent);
              border-right-color: var(--orduva-preloader-accent-soft);
              animation: orduvaEarlySpin 0.86s linear infinite;
            }
            #orduva-early-preloader .orduva-early-dot {
              position: absolute;
              left: 50%;
              top: 50%;
              width: 10px;
              height: 10px;
              transform: translate(-50%, -50%);
              border-radius: 999px;
              background: var(--orduva-preloader-accent);
              box-shadow: 0 0 0 8px var(--orduva-preloader-accent-faint);
            }
            #orduva-early-preloader .orduva-early-brand {
              margin: 22px 0 0;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.26em;
              text-transform: uppercase;
              color: var(--orduva-preloader-label);
            }
            #orduva-early-preloader .orduva-early-title {
              margin: 8px 0 0;
              font-size: 25px;
              line-height: 1.12;
              font-weight: 900;
              letter-spacing: -0.03em;
              color: #111827;
            }
            #orduva-early-preloader .orduva-early-dots {
              display: flex;
              justify-content: center;
              gap: 7px;
              margin-top: 18px;
            }
            #orduva-early-preloader .orduva-early-dots span {
              width: 7px;
              height: 7px;
              border-radius: 999px;
              background: var(--orduva-preloader-accent);
              animation: orduvaEarlyBounce 0.88s ease-in-out infinite;
            }
            #orduva-early-preloader .orduva-early-dots span:nth-child(2) { animation-delay: 0.12s; }
            #orduva-early-preloader .orduva-early-dots span:nth-child(3) { animation-delay: 0.24s; }
            @keyframes orduvaEarlySpin { to { transform: rotate(360deg); } }
            @keyframes orduvaEarlyBounce {
              0%, 80%, 100% { transform: translateY(0); opacity: 0.55; }
              40% { transform: translateY(-6px); opacity: 1; }
            }
            @media (prefers-reduced-motion: reduce) {
              #orduva-early-preloader .orduva-early-mark::after,
              #orduva-early-preloader .orduva-early-dots span { animation: none; }
            }
          `,
        }}
      />
      <div id="orduva-early-preloader" role="status" aria-live="polite" aria-label="Orduva is getting things ready">
        <div className="orduva-early-card">
          <div className="orduva-early-mark" aria-hidden="true"><span className="orduva-early-dot" /></div>
          <p className="orduva-early-brand">Orduva</p>
          <h1 className="orduva-early-title">We&apos;re getting things ready.</h1>
          <p className="orduva-early-copy">Loading the menu, rewards and offers so everything opens neatly.</p>
          <div className="orduva-early-dots" aria-hidden="true"><span /><span /><span /></div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              function normaliseHex(value){
                if (typeof value !== 'string') return '';
                var trimmed = value.trim().toUpperCase();
                return /^#[0-9A-F]{6}$/.test(trimmed) ? trimmed : '';
              }
              function hexToRgb(hex){
                var safe = normaliseHex(hex).replace('#','');
                if (!safe) return null;
                return { r: parseInt(safe.slice(0,2),16), g: parseInt(safe.slice(2,4),16), b: parseInt(safe.slice(4,6),16) };
              }
              function applyStoredAccent(){
                try {
                  var best = '';
                  var pathname = String(window.location && window.location.pathname || '').toLowerCase();
                  for (var i = 0; i < window.localStorage.length; i += 1) {
                    var key = window.localStorage.key(i) || '';
                    if (key.indexOf('orduva_storefront_payload_') !== 0) continue;
                    var parsed = JSON.parse(window.localStorage.getItem(key) || '{}');
                    var payload = parsed && parsed.payload;
                    var settings = payload && payload.settings;
                    var theme = settings && settings.storefrontTheme;
                    var candidate = normaliseHex(theme && (theme.storefrontSplashAccent || theme.storefrontMainLogoColor)) || normaliseHex(settings && settings.accentColor);
                    if (!candidate) continue;
                    if (!best) best = candidate;
                    var slug = payload && payload.tenant && payload.tenant.slug;
                    if (slug && pathname.indexOf(String(slug).toLowerCase()) >= 0) { best = candidate; break; }
                  }
                  var rgb = hexToRgb(best);
                  if (!rgb) return;
                  var root = document.getElementById('orduva-early-preloader');
                  if (!root) return;
                  root.style.setProperty('--orduva-preloader-accent', best);
                  root.style.setProperty('--orduva-preloader-accent-soft', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.20)');
                  root.style.setProperty('--orduva-preloader-accent-faint', 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.10)');
                  root.style.setProperty('--orduva-preloader-label', best);
                } catch(e) {}
              }
              applyStoredAccent();
              var startedAt = Date.now();
              var minimumMs = 2000;
              var hideTimer = null;
              var hidden = false;
              window.__ORDUVA_HIDE_EARLY_PRELOADER__ = function(){
                if (hidden) return;
                var finish = function(){
                  if (hidden) return;
                  hidden = true;
                  try { document.documentElement.classList.add('orduva-early-preloader-done'); } catch(e) {}
                };
                var elapsed = Date.now() - startedAt;
                var remaining = Math.max(0, minimumMs - elapsed);
                if (hideTimer) return;
                if (remaining <= 0) {
                  finish();
                } else {
                  hideTimer = window.setTimeout(finish, remaining);
                }
              };
            })();
          `,
        }}
      />
    </>
  );
}
