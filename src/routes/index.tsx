import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { CategoryPicker } from "@/components/CategoryPicker";
import { Security } from "@/components/Security";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Boys — London Removals, Cleaning & Handyman" },
      {
        name: "description",
        content:
          "London's superhero moving crew. Removals, end-of-tenancy cleaning and handyman work in one crew. Build a live quote in seconds.",
      },
      { property: "og:title", content: "The Boys — London Removals" },
      {
        property: "og:description",
        content: "Your moving supes are here. Removals, cleaning, handyman — one crew.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Services />
        <CategoryPicker />
        <Security />
      </main>
      <Footer />
    </div>
  );
}
