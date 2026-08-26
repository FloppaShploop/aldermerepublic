import { createFileRoute } from "@tanstack/react-router";
import { CollegeChrome, PageHeader } from "@/components/CollegeChrome";

export const Route = createFileRoute("/campus-life")({
  head: () => ({
    meta: [
      { title: "Campus Life — Wexford University" },
      {
        name: "description",
        content:
          "Residential houses, 480 student organizations, Division I athletics and the arts at Wexford University.",
      },
      { property: "og:title", content: "Campus Life — Wexford University" },
      { property: "og:description", content: "Houses, clubs, athletics and the arts on the Wexford quad." },
    ],
  }),
  component: CampusLife,
});

const items = [
  ["Residential houses", "All undergraduates live in one of twelve houses with resident faculty deans."],
  ["480 organizations", "From the Wexford Review to the Robotics Collective and the Glee Club."],
  ["Division I athletics", "31 varsity teams compete in the Colonial Athletic Conference."],
  ["Arts on the quad", "Three galleries, a repertory theatre and a 900-seat concert hall."],
];

function CampusLife() {
  return (
    <CollegeChrome>
      <PageHeader kicker="Student Experience" title="Campus Life" />
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-12 md:grid-cols-2">
        {items.map(([t, d]) => (
          <div key={t} className="rounded-sm border border-border bg-card p-6">
            <h2 className="text-lg">{t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </CollegeChrome>
  );
}
