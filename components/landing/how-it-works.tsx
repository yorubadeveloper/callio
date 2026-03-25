const steps = [
  {
    number: "01",
    title: "Connect",
    description: "Securely link your Google Calendar and personalize your preferences.",
  },
  {
    number: "02",
    title: "Configure",
    description: "Select news topics and set your location for precise updates.",
  },
  {
    number: "03",
    title: "Communicate",
    description: "Call anytime or schedule a daily briefing. It's that simple.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-32 w-full bg-muted/20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-24">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Seamless Integration
          </h2>
        </div>
        <div className="grid gap-16 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-start space-y-4">
              <span className="text-6xl font-thin text-muted-foreground/20 absolute -top-10 -left-4 select-none">
                {step.number}
              </span>
              <div className="relative z-10 pt-2">
                <h3 className="text-xl font-medium mb-2">{step.title}</h3>
                <p className="text-base text-muted-foreground font-light leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
