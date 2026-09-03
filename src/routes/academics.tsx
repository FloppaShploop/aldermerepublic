import { createFileRoute } from "@tanstack/react-router";
import { CollegeChrome, PageHeader } from "@/components/CollegeChrome";

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title: "Academics — Aldermere University" },
      {
        name: "description",
        content:
          "Explore Aldermere University's eleven schools, 92 undergraduate majors and graduate research programs.",
      },
      { property: "og:title", content: "Academics — Aldermere University" },
      { property: "og:description", content: "Eleven schools, 92 majors, and research across every discipline." },
    ],
  }),
  component: Academics,
});

const schools = [
  ["College of Arts & Sciences", "The academic core of the university, spanning 48 departments."],
  ["Halloran School of Engineering", "Applied research in robotics, materials and computing."],
  ["School of Medicine", "Clinical training paired with the Aldermere Teaching Hospital."],
  ["Ashworth School of Law", "Constitutional, environmental and technology law."],
  ["Graduate School of Business", "MBA, MSF and executive education programs."],
  ["School of Public Health", "Epidemiology, policy and global health initiatives."],
];

function Academics() {
  return (
    <CollegeChrome>
      <PageHeader kicker="Schools & Programs" title="Academics" />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-16">
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Aldermere's eleven schools share a single faculty, so an undergraduate in the College can
          study alongside doctoral researchers from their first semester.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {schools.map(([name, desc]) => (
            <div key={name} className="border border-border bg-card p-8 transition-colors hover:border-accent">
              <span className="mb-4 block h-1 w-10 bg-accent" />
              <h2 className="text-xl">{name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </CollegeChrome>
  );
}
