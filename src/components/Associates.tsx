import Image from "next/image";

/**
 * The partner credit that sits under the hero.
 *
 * The two marks have different aspect ratios — Guru Films is a 3:2 wordmark,
 * Saaj 'O' Style a 1:1 roundel — so they are not given the same height. A
 * square logo set to the same height as a wide one always reads as the smaller
 * of the two, because the eye compares area rather than height. The roundel is
 * therefore allowed to run a little taller so the pair balance optically.
 *
 * Both files are white or orange on transparency, which is why they can sit
 * directly on the plum ground with no plate behind them.
 */
const PARTNERS = [
  {
    name: "Saaj 'O' Style",
    src: "/partners/saaj-o-style.png",
    width: 1800,
    height: 1800,
    className: "h-[74px] sm:h-[88px]",
  },
  {
    name: "Guru Films",
    src: "/partners/guru-films.png",
    width: 1800,
    height: 1200,
    className: "h-[58px] sm:h-[70px]",
  },
];

export function Associates() {
  return (
    <section
      aria-labelledby="associates-heading"
      className="border-y border-night-600/50 bg-night-900/60"
    >
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-12">
        <h2
          id="associates-heading"
          className="text-center text-[10px] uppercase tracking-[0.34em] text-gold-500/80 sm:text-[11px]"
        >
          In association with
        </h2>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-20">
          {PARTNERS.map((partner) => (
            <li key={partner.name} className="flex flex-col items-center">
              {/* A fixed-height box around each mark, so two logos of
                  different proportions still hang from one centre line and
                  their captions land on a single row. */}
              <span className="flex h-[88px] items-center sm:h-[104px]">
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  className={`${partner.className} w-auto opacity-90 transition-opacity duration-300 hover:opacity-100`}
                />
              </span>
              <span className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted sm:text-[11px]">
                {partner.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
