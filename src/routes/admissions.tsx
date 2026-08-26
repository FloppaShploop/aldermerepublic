import { createFileRoute } from "@tanstack/react-router";
import { CollegeChrome, PageHeader } from "@/components/CollegeChrome";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions & Aid — Wexford University" },
      {
        name: "description",
        content:
          "Application deadlines, requirements and need-blind financial aid for undergraduate applicants to Wexford University.",
      },
      { property: "og:title", content: "Admissions & Aid — Wexford University" },
      { property: "og:description", content: "Deadlines, requirements and need-blind financial aid at Wexford." },
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
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl">Applying to Wexford</h2>
          <p className="mt-3 text-muted-foreground">
            We read every application in full. There is no minimum test score and no application
            fee. Admission is need-blind for all applicants, and Wexford meets 100% of demonstrated
            financial need with grant aid rather than loans.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>· Common Application or Wexford Application</li>
            <li>· School report and official transcript</li>
            <li>· Two teacher recommendations</li>
            <li>· Optional standardized testing</li>
          </ul>
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <h2 className="text-lg">Key dates</h2>
          <dl className="mt-4 divide-y divide-border">
            {dates.map(([d, l]) => (
              <div key={l} className="flex justify-between py-3 text-sm">
                <dt className="text-foreground">{d}</dt>
                <dd className="text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </CollegeChrome>
  );
}
