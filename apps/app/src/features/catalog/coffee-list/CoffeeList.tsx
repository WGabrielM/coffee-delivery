import { Button } from "../../../components/button/Button";
import { useCoffees } from "../api";
import { CoffeeCard } from "../coffee-card/CoffeeCard";

/**
 * The "Our coffees" section of the home page: the title and, under it, the loading, error, empty, or
 * data state of the catalog. Four 256 px columns, 32 px apart, with 40 px between rows, fill the 1120
 * px of the content; the last row keeps its cards on the left.
 */
export function CoffeeList() {
  const { data, isPending, isError, refetch } = useCoffees();

  return (
    <section
      aria-labelledby="coffees-heading"
      aria-busy={isPending}
      className="px-page pt-8 pb-38.5"
    >
      <div className="mx-auto max-w-content">
        <h2 id="coffees-heading" className="type-title-l text-subtitle">
          Our coffees
        </h2>
        <div className="mt-13.5">
          {isPending ? (
            <output className="flex items-center gap-3 type-text-regular-m text-text">
              <span
                data-spinner
                aria-hidden="true"
                className="size-6 animate-spin rounded-round border-2 border-button border-t-purple motion-reduce:animate-none"
              />
              Loading coffees…
            </output>
          ) : isError ? (
            <div role="alert" className="flex flex-col items-start gap-4">
              <p className="type-text-regular-m text-text">We couldn't load the coffees.</p>
              <Button variant="secondary" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : data.length === 0 ? (
            <p className="type-text-regular-m text-text">No coffees found.</p>
          ) : (
            <ul className="grid grid-cols-[repeat(4,16rem)] gap-x-8 gap-y-10">
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
