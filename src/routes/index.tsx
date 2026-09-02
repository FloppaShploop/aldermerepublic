import { createFileRoute, Link } from "@tanstack/react-router";
import { CollegeChrome } from "@/components/CollegeChrome";
import campus from "@/assets/campus.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aldermere University — Learning Without Limits" },
      {
        name: "description",
        content:
          "Aldermere University is a private research university offering 92 undergraduate programs, world-class faculty and a 1,400-acre New England campus.",
      },
      { property: "og:title", content: "Aldermere University — Learning Without Limits" },
      {
        property: "og:description",
        content: "A private research university in New England. Explore academics, admissions and campus life.",
      },
    ],
  }),
  component: Home,
});

const stats = [
  { k: "1782", v: "Founded" },
  { k: "6:1", v: "Student–faculty ratio" },
  { k: "92", v: "Undergraduate programs" },
  { k: "$3.1B", v: "Research funding" },
];

const news = [
  {
    t: "Aldermere physicists map a new class of quantum material",
    d: "A five-year study out of the Halloran Lab could reshape low-temperature computing.",
  },
  {
    t: "Record early applications for the Class of 2031",
    d: "Admissions received 41,209 early submissions, a 12% increase year over year.",
  },
  {
    t: "The Ashworth Library reopens after restoration",
    d: "Two years of work restored the 1894 reading room and added 400 study seats.",
  },
];

function Home() {
  return (
    <CollegeChrome>
      <section className="relative">
        <img
          src={campus}
          alt="Ivy-covered Aldermere University hall overlooking the main quad"
          width={1600}
          height={900}
          className="h-[420px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/45" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-5 pb-12">
            <h1 className="max-w-2xl text-4xl text-background sm:text-5xl">
              Veritas in Studio. Learning without limits.
            </h1>
            <p className="mt-4 max-w-xl text-background/85">
              For more than two centuries, Aldermere has brought together curious minds to ask harder
              questions and build better answers.
            </p>
            <Link
              to="/admissions"
              className="mt-6 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Apply to Aldermere
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v}>
              <p className="font-serif-display text-3xl text-primary">{s.k}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl">University News</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {news.map((n) => (
            <article key={n.t} className="rounded-sm border border-border bg-card p-6">
              <h3 className="text-lg leading-snug">{n.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{n.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl">Current students</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Access registration, grades and campus services through the Student Portal.
            </p>
          </div>
          <Link
            to="/portal"
            className="rounded-sm border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Student Portal Login
          </Link>
        </div>
      </section>
    </CollegeChrome>
  );
}
