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
              background:
                radial-gradient(circle at 18% 8%, rgba(255,106,61,0.18), transparent 34%),
                radial-gradient(circle at 82% 18%, rgba(255,177,104,0.20), transparent 34%),
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
              border: 1px solid rgba(255,106,61,0.24);
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
              border: 4px solid rgba(255,106,61,0.13);
            }
            #orduva-early-preloader .orduva-early-mark::after {
              border: 4px solid transparent;
              border-top-color: #ff6a3d;
              border-right-color: rgba(255,106,61,0.48);
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
              background: #ff6a3d;
              box-shadow: 0 0 0 8px rgba(255,106,61,0.10);
            }
            #orduva-early-preloader .orduva-early-brand {
              margin: 22px 0 0;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.26em;
              text-transform: uppercase;
              color: #b74a16;
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
              background: #ff6a3d;
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
          <div className="orduva-early-dots" aria-hidden="true"><span /><span /><span /></div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__ORDUVA_HIDE_EARLY_PRELOADER__ = function(){
              try { document.documentElement.classList.add('orduva-early-preloader-done'); } catch(e) {}
            };
          `,
        }}
      />
    </>
  );
}
