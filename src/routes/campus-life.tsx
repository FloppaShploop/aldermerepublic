import { createFileRoute } from "@tanstack/react-router";
import { CollegeChrome, PageHeader } from "@/components/CollegeChrome";

export const Route = createFileRoute("/campus-life")({
  head: () => ({
    meta: [
      { title: "Campus Life — Aldermere University" },
      {
        name: "description",
        content:
          "Residential houses, 480 student organizations, Division I athletics and the arts at Aldermere University.",
      },
      { property: "og:title", content: "Campus Life — Aldermere University" },
      { property: "og:description", content: "Houses, clubs, athletics and the arts on the Aldermere quad." },
    ],
  }),
  component: CampusLife,
});

const items = [
  ["Residential houses", "All undergraduates live in one of twelve houses with resident faculty deans."],
  ["480 organizations", "From the Aldermere Review to the Robotics Collective and the Glee Club."],
  ["Division I athletics", "31 varsity teams compete in the Colonial Athletic Conference."],
  ["Arts on the quad", "Three galleries, a repertory theatre and a 900-seat concert hall."],
];

function CampusLife() {
  return (
    <CollegeChrome>
      <PageHeader kicker="Student Experience" title="Campus Life" />
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-2 lg:px-16">
        {items.map(([t, d]) => (
          <div key={t} className="border border-border bg-card p-8 transition-colors hover:border-accent">
            <span className="mb-4 block h-1 w-10 bg-accent" />
            <h2 className="text-xl">{t}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </CollegeChrome>
  );
}
