import { useId, type ReactNode } from "react";

import type { IconName } from "../../../assets";
import { Icon } from "../../../components/icon/Icon";

type FormCardProps = {
  icon: IconName;
  /** The color of the icon: the address card is `yellow`, the payment card is `purple`. */
  tone: "yellow" | "purple";
  title: string;
  description: string;
  children: ReactNode;
};

const tones = { yellow: "text-yellow-dark", purple: "text-purple" } as const;

/**
 * A card of the left column of the checkout: an icon, a title, a line that explains it, and the
 * fields under them, 32 px below. A fieldset named by its title (the address card and the payment
 * card share it).
 */
export function FormCard({ icon, tone, title, description, children }: FormCardProps) {
  const titleId = useId();
  return (
    <fieldset aria-labelledby={titleId} className="min-w-0 rounded-button bg-card p-6 sm:p-10">
      <div className="flex items-start gap-2">
        <Icon name={icon} className={`mt-0.5 size-5.5 ${tones[tone]}`} />
        <div>
          <h3 id={titleId} className="type-text-regular-m text-subtitle">
            {title}
          </h3>
          <p className="type-text-regular-s text-text">{description}</p>
        </div>
      </div>
      <div className="mt-8">{children}</div>
    </fieldset>
  );
}
