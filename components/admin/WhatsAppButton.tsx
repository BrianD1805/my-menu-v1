type Props = {
  url: string | null;
};

export default function WhatsAppButton({ url }: Props) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-xl border px-3 py-2 text-sm font-medium"
    >
      Open WhatsApp
    </a>
  );
}
