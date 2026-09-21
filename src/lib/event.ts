/**
 * Single source of truth for every detail printed on the poster.
 * Shared by the landing page, the ticket, and the confirmation email so the
 * date or venue can never drift between them.
 */
export const EVENT = {
  host: "The Smirk Society",
  name: "Smirk'N'Raas",
  year: "2026",
  /** Reads on its own — used for page titles, meta descriptions and prose. */
  tagline: "Ghaziabad's Biggest Dandiya Night",
  /**
   * The badge that sits directly above the DANDIYA NIGHT title, as on the
   * poster. Kept separate from `tagline` so the words "Dandiya Night" do not
   * appear twice in a row.
   */
  ribbon: "Ghaziabad's Biggest",
  blurb: "Dance · Music · Food · Shopping and so much more!",
  dateLabel: "17th October 2026",
  dayLabel: "Saturday",
  timeLabel: "6:00 PM onwards",
  /** IST is UTC+5:30 — stored as an absolute instant for the countdown. */
  startsAt: new Date("2026-10-17T18:00:00+05:30"),
  venue: "Chancellor Club",
  venueArea: "Chiranjiv Vihar, Ghaziabad",
  mapsQuery: "Chancellor Club, Chiranjiv Vihar, Ghaziabad",
  instagram: "joinsmirksociety",
  instagramUrl: "https://instagram.com/joinsmirksociety",
} as const;

/**
 * Contact details.
 *
 * Every field below is optional and starts empty on purpose: the UI hides a
 * channel until it has a real value, so nothing half-filled is ever shown to a
 * guest. Fill one in and its button appears on the contact page (and, for
 * WhatsApp, as the floating chat button).
 *
 * Razorpay asks for a contact phone and a business address when it activates
 * an account, so `phone` and `address` are worth filling in before applying.
 */
type ContactDetails = {
  /** Digits only, including country code. e.g. "919876543210" for +91 98765 43210 */
  whatsapp: string;
  /** Shown as a tel: link. e.g. "+91 98765 43210" */
  phone: string;
  /** Registered business address, for Razorpay activation. */
  address: string;
  /** Hours during which someone actually replies. */
  hours: string;
};

// Explicitly typed rather than `as const`: these start empty, and a literal
// "" type would narrow to `never` inside the `if (CONTACT.phone)` guards that
// decide whether each channel renders.
export const CONTACT: ContactDetails = {
  whatsapp: "918448702151",
  phone: "+91 84487 02151",
  address: "A-14, Gagan Enclave\nGhaziabad, Uttar Pradesh",
  hours: "10 AM to 8 PM, every day",
};

export function whatsappUrl(message?: string): string | null {
  if (!CONTACT.whatsapp) return null;
  const text = message ?? `Hi! I have a question about ${EVENT.name} ${EVENT.year}.`;
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const HIGHLIGHTS = [
  { icon: "mic", label: "Live Band", note: "Live garba vocals all night" },
  { icon: "sticks", label: "Free Dandiya Sticks", note: "Provided at entry" },
  { icon: "headphones", label: "DJ", note: "Bollywood & Gujarati remixes" },
  { icon: "food", label: "Food Stalls", note: "Chaat, dessert & more" },
  { icon: "bag", label: "Shopping Stalls", note: "Ethnic wear & jewellery" },
  { icon: "dhol", label: "Dhol", note: "Live dhol players" },
  { icon: "decor", label: "Thematic Decor", note: "Photo-ready sets" },
  { icon: "games", label: "Fun Games", note: "Prizes through the night" },
  { icon: "dance", label: "Open Dance Floor", note: "Room for everyone" },
  { icon: "camera", label: "Photographer", note: "Event photos on us" },
] as const;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  EVENT.mapsQuery,
)}`;
