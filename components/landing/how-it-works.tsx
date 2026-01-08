const steps = [
  {
    number: "1",
    title: "Sign Up",
    description: "Connect your Google Calendar and set preferences",
  },
  {
    number: "2",
    title: "Customize",
    description: "Choose news topics and add your location",
  },
  {
    number: "3",
    title: "Call & Listen",
    description: "Dial your number to hear your briefing",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-muted/30 py-24 w-full">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three simple steps to your daily briefing
          </p>
        </div>
        <div className="mx-auto mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground">
                <span className="text-xl font-bold">{step.number}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
