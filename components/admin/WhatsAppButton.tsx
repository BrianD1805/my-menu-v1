"use client";

type Props = {
  phone: string | null;
  message: string | null;
};

function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}

export default function WhatsAppButton({ phone, message }: Props) {
  if (!phone || !message) return null;

  function openWhatsApp() {
    const cleanedPhone = cleanPhone(phone ?? '');
    const encodedMessage = encodeURIComponent(message ?? '');

    const appUrl = `whatsapp://send?phone=${cleanedPhone}&text=${encodedMessage}`;
    const webUrl = `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`;
    const mobileUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;

    if (isMobileDevice()) {
      window.location.href = mobileUrl;
      return;
    }

    let didHide = false;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        didHide = true;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.location.href = appUrl;

    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (!didHide) {
        window.open(webUrl, "_blank", "noopener,noreferrer");
      }
    }, 1200);
  }

  return (
    <button
      type="button"
      onClick={openWhatsApp}
      className="inline-flex rounded-xl border px-3 py-2 text-sm font-medium"
    >
      Open WhatsApp
    </button>
  );
}
