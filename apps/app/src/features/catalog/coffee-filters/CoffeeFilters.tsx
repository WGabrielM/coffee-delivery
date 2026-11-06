import { Button } from "../../../components/button/Button";
import { Tag } from "../../../components/tag/Tag";
import { COFFEE_TAGS, orderTags } from "../coffee-tags";

type CoffeeFiltersProps = {
  /** The slugs of the selected chips. */
  selected: readonly string[];
  /** Called with the new selection, always in the order of the chips. */
  onChange: (selected: string[]) => void;
};

/**
 * The five tag chips, a group of toggle buttons. "Clear filters" shows before the chips while at
 * least one is selected, so the chips do not move when the button appears.
 */
export function CoffeeFilters({ selected, onChange }: CoffeeFiltersProps) {
  const toggle = (slug: string, pressed: boolean) =>
    onChange(orderTags(pressed ? [...selected, slug] : selected.filter((item) => item !== slug)));

  return (
    <div className="flex items-center gap-2">
      {selected.length > 0 ? (
        <Button variant="secondary" onClick={() => onChange([])}>
          Clear filters
        </Button>
      ) : null}
      <fieldset className="flex gap-2">
        <legend className="sr-only">Filter by tag</legend>
        {COFFEE_TAGS.map((tag) => (
          <Tag
            key={tag.slug}
            variant="filter"
            pressed={selected.includes(tag.slug)}
            onPressedChange={(pressed) => toggle(tag.slug, pressed)}
          >
            {tag.name}
          </Tag>
        ))}
      </fieldset>
    </div>
  );
}
