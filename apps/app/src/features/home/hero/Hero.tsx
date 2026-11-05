import { heroImage, type IconName } from "../../../assets";
import { Icon } from "../../../components/icon/Icon";

type Benefit = {
  text: string;
  icon: IconName;
  /** The Tailwind class of the circle: one color token per benefit, as in the design. */
  circle: string;
};

const benefits: readonly Benefit[] = [
  { text: "Simple and secure purchase", icon: "shopping-cart-fill", circle: "bg-yellow-dark" },
  { text: "Packaging keeps the coffee intact", icon: "package-fill", circle: "bg-text" },
  { text: "Fast and tracked delivery", icon: "timer-fill", circle: "bg-yellow" },
  { text: "Your coffee arrives fresh to you", icon: "coffee-fill", circle: "bg-purple" },
];

/**
 * The first screen of the home page: the title, the subtitle, four benefits, and the cup image, over
 * soft blurred shapes. The shapes are styles (no image), hidden from assistive technology, and
 * pointer-transparent; they bleed below the section, clipped at the top and the sides. The cup image is decorative (`alt=""`): the text already says everything.
 */
export function Hero() {
  return (
    <section className="relative isolate px-page">
      <div
        data-hero-shapes
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [clip-path:inset(0_0_-240px_0)]"
      >
        <div className="absolute top-12 -left-16 size-80 rounded-round bg-hero-blob/30 blur-[100px]" />
        <div className="absolute top-24 right-24 size-96 rounded-round bg-purple-light blur-[100px]" />
        <div className="absolute right-0 bottom-8 size-64 rounded-round bg-hero-blob/25 blur-[100px]" />
      </div>
      <div className="mx-auto flex max-w-content items-center justify-between py-23.5">
        <div className="flex w-136 shrink-0 flex-col">
          <h1 className="type-title-xl text-title">Find the perfect coffee for any time of day</h1>
          <p className="mt-4 type-text-regular-l text-subtitle">
            With Coffee Delivery you get your coffee wherever you are, at any time
          </p>
          <ul className="mt-16.5 grid w-max grid-cols-[auto_auto] gap-x-10 gap-y-5">
            {benefits.map(({ text, icon, circle }) => (
              <li
                key={text}
                className="flex items-center gap-3 type-text-regular-m whitespace-nowrap text-text"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-round text-white ${circle}`}
                >
                  <Icon name={icon} className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <img
          src={heroImage}
          alt=""
          width={476}
          height={360}
          fetchPriority="high"
          className="shrink-0"
        />
      </div>
    </section>
  );
}
