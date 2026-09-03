import { createFileRoute, Link } from "@tanstack/react-router";
import { CollegeChrome } from "@/components/CollegeChrome";
import heroLibrary from "@/assets/hero-library.jpg";
import newsLab from "@/assets/news-lab.jpg";
import newsGala from "@/assets/news-gala.jpg";
import newsLecture from "@/assets/news-lecture.jpg";
import portalStudents from "@/assets/portal-students.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aldermere University — Where Tradition Meets Tomorrow" },
      {
        name: "description",
        content:
          "Aldermere University is a private research university offering 140+ programs, a 9:1 student-faculty ratio and a forested New England campus.",
      },
      { property: "og:title", content: "Aldermere University — Where Tradition Meets Tomorrow" },
      {
        property: "og:description",
        content: "A private research university in New England. Explore academics, admissions and campus life.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const stats = [
  { k: "9:1", v: "Student–faculty ratio" },
  { k: "140+", v: "Research fields" },
  { k: "$24M", v: "Annual scholarship aid" },
  { k: "12k", v: "Global alumni network" },
];

const news = [
  {
    img: newsLab,
    alt: "Student examining a sample through a microscope with forest visible through the lab window",
    tag: "Research",
    t: "Aldermere scientists discover rare endemic moss species",
    d: "October 24, 2026 — 4 min read",
  },
  {
    img: newsGala,
    alt: "String lights over the quad during the annual winter gala",
    tag: "Campus Life",
    t: "The Annual Winter Solstice Gala: a tradition of lights",
    d: "October 18, 2026 — 6 min read",
  },
  {
    img: newsLecture,
    alt: "Professor lecturing in a wood-paneled seminar room",
    tag: "Academics",
    t: "New interdisciplinary major: Eco-Social Policy & Ethics",
    d: "October 12, 2026 — 3 min read",
  },
];

function Home() {
  return (
    <CollegeChrome>
      <section className="grid min-h-[80vh] grid-cols-1 items-stretch overflow-hidden border-b border-border lg:grid-cols-12">
        <div className="z-10 flex flex-col justify-center px-6 py-16 lg:col-span-7 lg:px-16 lg:py-24">
          <span className="mb-4 block text-sm font-bold uppercase tracking-[0.22em] text-accent">
            Est. 1782
          </span>
          <h1 className="mb-8 text-5xl leading-tight text-foreground lg:text-7xl">
            Where Tradition <br />
            <span className="italic text-secondary-foreground">Meets Tomorrow</span>
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-muted-foreground">
            Leading the vanguard of academic excellence in the heart of the forest. Discover a
            community dedicated to global impact and rigorous inquiry.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              to="/academics"
              className="bg-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-secondary-foreground"
            >
              Explore Programs
            </Link>
            <Link
              to="/admissions"
              className="border-b-2 border-accent pb-1 text-sm font-bold text-foreground transition-colors hover:text-accent"
            >
              Request Prospectus
            </Link>
          </div>
        </div>
        <div className="relative h-[400px] lg:col-span-5 lg:h-auto">
          <img
            src={heroLibrary}
            alt="The grand Aldermere library reading room with emerald lamps and dark wood shelves"
            width={960}
            height={1200}
            className="h-full w-full object-cover"
          />
          <div className="absolute right-0 bottom-0 hidden bg-accent p-8 lg:block">
            <p className="font-serif-display text-xl italic text-accent-foreground">
              “The forest is our classroom, <br />
              knowledge is our legacy.”
            </p>
          </div>
        </div>
      </section>

      <section className="bg-primary px-6 py-12 text-primary-foreground lg:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v} className="text-center">
              <div className="mb-2 font-serif-display text-3xl text-accent lg:text-4xl">{s.k}</div>
              <div className="text-xs uppercase tracking-[0.18em] opacity-70">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-16">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-4xl text-foreground">Latest from the Forest</h2>
            <div className="h-1 w-24 bg-accent" />
          </div>
          <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground sm:block">
            The Aldermere Review
          </span>
        </div>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {news.map((n) => (
            <article key={n.t} className="group">
              <div className="mb-6 aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={n.img}
                  alt={n.alt}
                  width={640}
                  height={800}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
                />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {n.tag}
              </span>
              <h3 className="mt-2 mb-4 text-xl leading-snug group-hover:underline">{n.t}</h3>
              <p className="text-sm text-muted-foreground">{n.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch bg-primary lg:flex-row">
          <div className="flex flex-col justify-center p-12 lg:w-1/2 lg:p-20">
            <h2 className="mb-6 text-4xl text-primary-foreground">Current Students</h2>
            <p className="mb-8 max-w-md text-primary-foreground/70">
              Access your course materials, campus resources, and academic support tools in one
              secure location.
            </p>
            <Link
              to="/portal"
              className="w-fit bg-accent px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground transition-colors hover:bg-primary-foreground"
            >
              Student Portal Login
            </Link>
          </div>
          <div className="min-h-[300px] lg:h-auto lg:w-1/2">
            <img
              src={portalStudents}
              alt="Students studying together in the Aldermere library lounge"
              width={800}
              height={640}
              loading="lazy"
              className="h-full w-full object-cover opacity-80"
            />
          </div>
        </div>
      </section>
    </CollegeChrome>
  );
}
