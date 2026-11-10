import { useState } from "react";

import { Button } from "../../../components/button/Button";
import { ErrorState } from "../../../components/error-state/ErrorState";
import { LoadingState } from "../../../components/loading-state/LoadingState";
import { useCoffees } from "../api";
import { CoffeeCard } from "../coffee-card/CoffeeCard";
import { CoffeeFilters } from "../coffee-filters/CoffeeFilters";

function countText(count: number): string {
  return `${count} ${count === 1 ? "coffee" : "coffees"}`;
}

/**
 * The "Our coffees" section of the home page: the title with the tag chips at its right and, under
 * them, the loading, error, empty, or data state of the catalog. 256 px columns, 32 px apart, with
 * 40 px between rows: four fill the 1120 px of the content (the last row keeps its cards on the
 * left), and fewer fit on a smaller screen, centered.
 * The selection of chips lives here, in state; the server filters.
 */
export function CoffeeList() {
  const [selected, setSelected] = useState<string[]>([]);
  const { data, isPending, isPlaceholderData, isError, refetch } = useCoffees(selected);
  const filtered = selected.length > 0;

  return (
    <section
      aria-labelledby="coffees-heading"
      aria-busy={isPending || isPlaceholderData}
      className="px-page pt-8 pb-16 lg:pb-38.5"
    >
      <div className="mx-auto max-w-content">
        {/* Below 1024 px the chips go under the title and wrap onto more rows when they need to. */}
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="coffees-heading" className="type-title-l text-subtitle">
            Our coffees
          </h2>
          <CoffeeFilters selected={selected} onChange={setSelected} />
        </div>
        <div className="mt-8 lg:mt-13.5">
          <p aria-live="polite" className="sr-only">
            {data && !isPlaceholderData ? countText(data.length) : ""}
          </p>
          {isPending ? (
            <LoadingState text="Loading coffees…" />
          ) : isError ? (
            <ErrorState message="We couldn't load the coffees." onRetry={() => void refetch()} />
          ) : data.length === 0 ? (
            filtered ? (
              <div className="flex flex-col items-start gap-4">
                <p className="type-text-regular-m text-text">
                  No coffees match the selected filters.
                </p>
                <Button variant="secondary" onClick={() => setSelected([])}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <p className="type-text-regular-m text-text">No coffees found.</p>
            )
          ) : (
            // As many 256 px columns as fit: four in the 1120 px of the design, two on a tablet, one on a phone.
            <ul className="grid grid-cols-[repeat(auto-fill,16rem)] justify-center gap-x-8 gap-y-10">
              {data.map((coffee) => (
                <li key={coffee.id}>
                  <CoffeeCard coffee={coffee} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
