import { createFileRoute } from "@tanstack/react-router";
import { CollegeChrome, PageHeader } from "@/components/CollegeChrome";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions & Aid — Aldermere University" },
      {
        name: "description",
        content:
          "Application deadlines, requirements and need-blind financial aid for undergraduate applicants to Aldermere University.",
      },
      { property: "og:title", content: "Admissions & Aid — Aldermere University" },
      { property: "og:description", content: "Deadlines, requirements and need-blind financial aid at Aldermere." },
    ],
  }),
  component: Admissions,
});

const dates = [
  ["November 1", "Early Action deadline"],
  ["January 5", "Regular Decision deadline"],
  ["February 15", "Financial aid materials due"],
  ["March 28", "Decisions released"],
];

function Admissions() {
  return (
    <CollegeChrome>
      <PageHeader kicker="Undergraduate" title="Admissions & Aid" />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:px-16">
        <div>
          <h2 className="text-3xl">Applying to Aldermere</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We read every application in full. There is no minimum test score and no application
            fee. Admission is need-blind for all applicants, and Aldermere meets 100% of demonstrated
            financial need with grant aid rather than loans.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li>· Common Application or Aldermere Application</li>
            <li>· School report and official transcript</li>
            <li>· Two teacher recommendations</li>
            <li>· Optional standardized testing</li>
          </ul>
        </div>
        <div className="border border-border bg-card p-8">
          <span className="mb-4 block h-1 w-10 bg-accent" />
          <h2 className="text-xl">Key dates</h2>
          <dl className="mt-4 divide-y divide-border">
            {dates.map(([d, l]) => (
              <div key={l} className="flex justify-between py-3 text-sm">
                <dt className="font-semibold text-foreground">{d}</dt>
                <dd className="text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </CollegeChrome>
  );
}
