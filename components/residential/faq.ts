import { residential } from "@/config/residential";

const { contact, policies } = residential;
const askUs = `We're finalizing this. Call or text us at ${contact.phone} for details.`;

// Answers follow the claims rules: no guarantee, credit or notice period until it's set in config.
export const faqs: { q: string; a: string }[] = [
  {
    q: "What if I have a gate code?",
    a: "Add it when you sign up. Only our office and the person servicing your home can see it.",
  },
  {
    q: "What happens on holiday weeks?",
    a: "We follow your city's holiday collection schedule. If your pickup moves a day, we move with it.",
  },
  {
    q: "Do you come in the rain?",
    a: policies.rain ?? askUs,
  },
  {
    q: "What if I'm away?",
    a: `Text us at ${contact.phone} with your dates and we'll pause or skip your service. Online pause is coming soon.`,
  },
  {
    q: "What if a visit is missed?",
    a: policies.missedVisit ?? askUs,
  },
  {
    q: "Can you handle a steep driveway or stairs?",
    a: "Yes. For steep driveways, stairs or a long walk to the curb, we may quote a custom price. Check the box when you sign up and we'll text you a price.",
  },
  {
    q: "How do I cancel?",
    a: policies.cancellation
      ? `Billing is month-to-month. Cancel anytime by call, text or email. ${policies.cancellation}`
      : `Billing is month-to-month. Call or text us at ${contact.phone}. Notice period: see the service terms.`,
  },
  {
    q: "Do you take bulky items?",
    a: `Bulky items aren't part of this service. Ask us about it.`,
  },
  {
    q: "Are your staff background-checked?",
    a: "Yes.",
  },
];
