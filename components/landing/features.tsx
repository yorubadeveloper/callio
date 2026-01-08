import { Calendar, Cloud, Newspaper } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Calendar Sync",
    description: "Hear today's events and never miss a meeting.",
  },
  {
    icon: Cloud,
    title: "Weather Updates",
    description: "Get current weather for your location.",
  },
  {
    icon: Newspaper,
    title: "News Briefs",
    description: "Stay informed on topics you care about.",
  },
];

export function Features() {
  return (
    <section className="border-t border-border py-24 w-full">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-muted-foreground">
            Your daily briefing in one simple call
          </p>
        </div>
        <div className="mx-auto mt-16 grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
