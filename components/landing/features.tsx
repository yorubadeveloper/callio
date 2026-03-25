import { CalendarBlank, CloudSun, NewspaperClipping, PhoneCall } from "@phosphor-icons/react/dist/ssr";

const features = [
  {
    icon: CalendarBlank,
    title: "Calendar Sync",
    description: "Start your day knowing exactly what's ahead. Seamless integration with your schedule.",
  },
  {
    icon: CloudSun,
    title: "Weather Context",
    description: "Prepare for the day with precise, location-based weather updates.",
  },
  {
    icon: NewspaperClipping,
    title: "Curated Briefs",
    description: "Stay informed with news that matters to you, filtered from the noise.",
  },
  {
    icon: PhoneCall,
    title: "Proactive Calls",
    description: "Set your schedule. We'll call you with a briefing or meeting reminders.",
  },
];

export function Features() {
  return (
    <section className="py-32 w-full bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-24">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl text-foreground">
            Essential Intelligence
          </h2>
          <p className="mt-4 text-lg text-muted-foreground font-light">
            Everything you need to know, delivered in a single, focused conversation.
          </p>
        </div>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-start space-y-4 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors group-hover:border-foreground/50">
                <feature.icon size={24} weight="light" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
