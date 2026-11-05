import { CoffeeList } from "../features/catalog/coffee-list/CoffeeList";
import { Hero } from "../features/home/hero/Hero";

export function HomePage() {
  return (
    <>
      <Hero />
      <CoffeeList />
    </>
  );
}
