import { whatsappUrl } from "@/lib/event";
import { WhatsAppIcon } from "@/components/Icons";

/**
 * Floating "chat with us" button.
 *
 * Renders nothing until a WhatsApp number is set in `CONTACT.whatsapp`, so an
 * unconfigured site never shows a button that goes nowhere.
 *
 * Sits clear of the bottom-right corner: Netlify pins a "Powered by Netlify"
 * badge there on the free tier, which would otherwise cover this button.
 */
export function WhatsAppButton({ message }: { message?: string }) {
  const href = whatsappUrl(message);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-xl shadow-black/40 transition-transform hover:scale-105 focus-visible:scale-105 sm:right-6"
    >
      <WhatsAppIcon className="h-7 w-7 text-white" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-night-800 px-3 py-1.5 text-xs text-cream opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block">
        Chat with us
      </span>
    </a>
  );
}
