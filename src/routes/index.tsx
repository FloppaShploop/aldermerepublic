import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ShieldCheck, Layers } from "lucide-react";
import { KnowledgeChrome } from "@/components/KnowledgeChrome";
import { Button } from "@/components/ui/button";
import classroom from "@/assets/knowledge-classroom.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Knowledge — A world of learning, connected" },
      {
        name: "description",
        content:
          "Knowledge connects students with their learning resources. Explore school resources and sign in to your student portal.",
      },
      { property: "og:title", content: "Knowledge — A world of learning, connected" },
      {
        property: "og:description",
        content: "A world of learning, connected. School resources and student sign-in with Knowledge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <KnowledgeChrome>
      <section className="knowledge-intro mx-auto max-w-6xl px-6 pt-12 pb-16 md:px-10 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="knowledge-heading text-5xl leading-[1.1] md:text-6xl">Knowledge.<br />A world of <span className="knowledge-underline">learning,</span><br />connected.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground md:text-lg">Bring your school day together. A single place to connect with your resources, explore new ideas, and keep learning.</p>
          </div>
          <img src={classroom.url} width={1448} height={1086} alt="Two students enjoying learning together with a tablet in their classroom" className="aspect-[4/3] w-full object-cover" />
        </div>
        <div className="relative z-10 mt-10 grid max-w-[500px] grid-cols-2 gap-3">
          <Button asChild className="col-span-2 h-20 justify-between rounded-lg px-6 text-xl font-normal md:text-2xl"><Link to="/portal">Log in as a student<ArrowRight className="size-6 rounded-full border border-primary-foreground p-1" /></Link></Button>
          <Button asChild variant="outline" className="h-24 justify-between gap-3 whitespace-normal rounded-lg border-border px-5 text-left text-base font-normal"><Link to="/academics">For schools<ArrowRight className="text-primary" /></Link></Button>
          <Button asChild variant="outline" className="h-24 justify-between gap-3 whitespace-normal rounded-lg border-border px-5 text-left text-base font-normal"><Link to="/campus-life">For our<br />community<ArrowRight className="text-primary" /></Link></Button>
        </div>
      </section>
      <section className="knowledge-about bg-secondary px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="knowledge-heading text-4xl md:text-5xl">What is Knowledge?</h2>
          <div className="mt-16 grid items-center gap-12 md:grid-cols-2 md:gap-24">
            <div className="knowledge-photo-shape"><img src={classroom.url} width={1448} height={1086} loading="lazy" alt="Students sharing ideas in a classroom" className="aspect-square w-full object-cover" /></div>
            <div><BookOpen className="mb-5 size-8 text-primary" /><h3 className="knowledge-heading text-3xl md:text-4xl">Power classroom<br />learning</h3><p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">Discover the resources, people, and possibilities that make every school day a chance to grow.</p><Button asChild variant="link" className="mt-8 px-0 text-base"><Link to="/academics">Schools overview<ArrowRight /></Link></Button></div>
          </div>
        </div>
      </section>
      <section className="bg-muted px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:gap-24">
          <div><ShieldCheck className="mb-5 size-8 text-primary" /><h2 className="knowledge-heading text-3xl md:text-4xl">Your school day.<br />Your own space.</h2><p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">Sign in to your student portal and stay connected to your school community.</p><Button asChild variant="link" className="mt-8 px-0 text-base"><Link to="/portal">Student sign-in<ArrowRight /></Link></Button></div>
          <div><Layers className="mb-5 size-8 text-primary" /><h2 className="knowledge-heading text-3xl md:text-4xl">One community.<br />Endless possibilities.</h2><p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">From the classroom to campus life, find your next interest and make room for something new.</p><Button asChild variant="link" className="mt-8 px-0 text-base"><Link to="/campus-life">Explore student life<ArrowRight /></Link></Button></div>
        </div>
      </section>
    </KnowledgeChrome>
  );
}
