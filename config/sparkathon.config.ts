export interface DomainItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}

export interface JudgingCriterion {
  id: string;
  number: string;
  title: string;
  weight?: string;
  description: string;
}

export interface EventFlowItem {
  id: string;
  number: string;
  step: string;
  title: string;
  name: string;
  time: string;
}

export interface FAQItem {
  id: string;
  number: string;
  question: string;
  answer: string;
}

export const SPARKATHON_CONFIG = {
  name: "SPARK-A-THON",
  year: "2026",
  tagline: "THE FRONTIER IS NOT FOUND. IT IS BUILT.",
  subTagline: "Where elemental curiosity ignites the next paradigm.",

  // Dates: strictly configurable (as published in brochure)
  dates: {
    display: "08.10.26",
    raw: "2026-10-08",
    note: "Official date published in brochure (pending final organizer re-confirmation)",
    isConfirmed: true,
  },

  // Dynamic Pricing Engine
  pricing: {
    minTeamSize: 2,
    maxTeamSize: 5,
    baseFee: 400,
    additionalMemberFee: 50,
    allowedSizes: [2, 3, 4, 5] as const,
    calculateFee: (participantCount: number): number => {
      const count = Math.max(2, Math.min(5, Math.floor(participantCount)));
      return count === 5 ? 400 : 350;
    },
    formatFee: (participantCount: number): string => {
      const count = Math.max(2, Math.min(5, Math.floor(participantCount)));
      const fee = count === 5 ? 400 : 350;
      return `₹${fee}`;
    },
  },

  // Official Spark-A-Thon Sector Domains (Allowlist for Team Selection)
  sectors: {
    domains: [
      "AI and Cybersec",
      "Smart Energy Systems",
      "Robotics or Drone and Fixed Wing",
      "IoT or Embedded Systems",
      "Open Innovation",
    ] as const,
  },

  // Payment: Centralized payment configuration
  // Official payment links will be provided by event organizers.
  // Setting enabled to true with valid URLs activates direct payment redirection on the success screen.
  payment: {
    enabled: false,
    url: "", // Maintained for route handler backwards compatibility
    url400: "", // Official payment link for 2-4 member teams (₹400)
    url450: "", // Official payment link for 5 member teams (₹450)
    provider: "Razorpay",
    note: "Official payment link awaited from organizers. No payment is processed on this website.",
  },

  // Registration Configuration
  registration: {
    chamberTitle: "JOIN THE FRONTIER",
    chamberSubtitle: "Assemble your squad to construct the next paradigm.",
    ctaText: "REGISTER YOUR TEAM",
    label: "REGISTER YOUR TEAM",
    url: "#register",
    minMembers: 2,
    maxMembers: 5,
    teamSize: "2–5 members",
    entryFee: "₹350 for 2-4 members, ₹400 for 5 members",
    totalPool: "₹20,000",
    note: "Official registration dispatch portal. No payment is processed on this website.",
  },

  // ACT VI — THE BOUNTY
  bounty: {
    totalPool: "₹20,000",
    label: "CASH PRIZE POOL",
    note: "Official verified prize pool awarded across frontier domains",
  },

  // ACT IV — THE 5 OFFICIAL DOMAINS
  domains: [
    {
      id: "ai-cybersec",
      number: "01",
      title: "AI & Cybersec",
      subtitle: "Autonomous Defense & Intelligence",
      description: "Forging resilient neural systems, cryptographic architectures, and defensive autonomous agents to safeguard digital frontiers.",
      tags: ["Agentic AI", "Zero-Trust", "Applied Cryptography", "Threat Detection"],
    },
    {
      id: "smart-energy",
      number: "02",
      title: "Smart Energy Systems",
      subtitle: "Decentralized Power & Grid Resiliency",
      description: "Harnessing algorithmic load balancing, next-gen storage integration, and micro-generation infrastructure for a self-sustaining world.",
      tags: ["Microgrids", "Battery Intelligence", "Clean Tech", "Grid Optimization"],
    },
    {
      id: "robotics-drones",
      number: "03",
      title: "Robotics or Drone and Fixed Wing",
      subtitle: "Autonomous Kinetics & Aerial Frontiers",
      description: "Pioneering terrestrial kinetics, aerial aerodynamics, autonomous flight control, and field-deployable robotic platforms.",
      tags: ["Aerial Autonomy", "Fixed-Wing Systems", "SLAM", "Field Kinetics"],
    },
    {
      id: "iot-embedded",
      number: "04",
      title: "IoT or Embedded Systems",
      subtitle: "Low-Power Sensing & Edge Silicon",
      description: "Engineering rugged, hyper-efficient embedded compute architectures and edge-sensory mesh networks operating in harsh frontiers.",
      tags: ["Edge Computing", "Mesh Networks", "Low-Power Hardware", "RTOS"],
    },
    {
      id: "open-innovation",
      number: "05",
      title: "Open Innovation",
      subtitle: "Radical Explorations & Unbounded Tech",
      description: "Unconstrained frontier engineering tackling breakthrough cross-disciplinary challenges that redefine existing paradigms.",
      tags: ["Cross-Disciplinary", "Wildcard Prototypes", "Novel Interfaces", "Breakthroughs"],
    },
  ] as DomainItem[],

  // ACT V — THE ARENA (Official Judging Criteria)
  judgingCriteria: [
    {
      id: "creativity",
      number: "01",
      title: "Creativity & Innovation",
      description: "Novelty of foundational concepts, unconventional engineering ingenuity, and departure from derivative patterns.",
    },
    {
      id: "technical",
      number: "02",
      title: "Technical Feasibility",
      description: "Architectural robustness, engineering execution rigor, system stability, and real-world deployment viability.",
    },
    {
      id: "scalability",
      number: "03",
      title: "Scalability & Market Potential",
      description: "Long-term scaling resilience, resource efficiency, economic sustainability, and ecosystem adoption capability.",
    },
    {
      id: "presentation",
      number: "04",
      title: "Presentation & Clarity",
      description: "Articulation of problem landscape, narrative precision, live architectural defense, and technical communication.",
    },
    {
      id: "impact",
      number: "05",
      title: "Problem-Solving Impact",
      description: "Measurable efficacy and systemic transformation in confronting bottlenecks across frontier engineering domains.",
    },
  ] as JudgingCriterion[],

  // ACT VII — THE FLOW (Officially Confirmed Schedule Only)
  eventFlow: [
    {
      id: "registration",
      number: "01",
      step: "STAGE 01",
      title: "Registration",
      name: "Registration",
      time: "08:45 AM — 09:30 AM",
    },
    {
      id: "inauguration",
      number: "02",
      step: "STAGE 02",
      title: "Inauguration",
      name: "Inauguration",
      time: "09:45 AM — 10:30 AM",
    },
    {
      id: "judging-1",
      number: "03",
      step: "STAGE 03",
      title: "Judging Round (First)",
      name: "Judging Round (First)",
      time: "11:00 AM — 12:30 PM",
    },
    {
      id: "lunch",
      number: "04",
      step: "STAGE 04",
      title: "Lunch Break",
      name: "Lunch Break",
      time: "12:30 PM — 01:00 PM",
    },
    {
      id: "judging-2",
      number: "05",
      step: "STAGE 05",
      title: "Judging Round (Resume)",
      name: "Judging Round (Resume)",
      time: "01:15 PM — 03:00 PM",
    },
    {
      id: "valedictory",
      number: "06",
      step: "STAGE 06",
      title: "Valedictory",
      name: "Valedictory",
      time: "03:30 PM — 04:00 PM",
    },
  ] as EventFlowItem[],

  // Confirmed Official FAQ
  faq: [
    {
      id: "team-size",
      number: "01",
      question: "What is the allowed team size?",
      answer: "Teams can have 2 to 5 members.",
    },
    {
      id: "registration-fee",
      number: "02",
      question: "What is the registration fee?",
      answer: "₹350 for teams of 2–4 members and ₹400 for teams of 5 members.",
    },
    {
      id: "prize-pool",
      number: "03",
      question: "What is the prize pool?",
      answer: "The official cash prize pool is ₹20,000.",
    },
    {
      id: "judging-criteria",
      number: "04",
      question: "What are the judging criteria?",
      answer: "Creativity & Innovation; Technical Feasibility; Scalability & Market Potential; Presentation & Clarity; Problem-Solving Impact.",
    },
    {
      id: "event-schedule",
      number: "05",
      question: "What is the event-day schedule?",
      answer: "Player Entry / Registration 9:00–9:45 AM; Inauguration 10:00–10:30 AM; Exhibition 10:30 AM–12:30 PM; Lunch 12:30–1:00 PM; Valedictory 3:30–4:00 PM.",
    },
    {
      id: "registration-payment",
      number: "06",
      question: "How do we register and pay?",
      answer: "Teams submit their registration details through the website. Payment gateway integration is not active yet, so online payment is not currently processed on this website.",
    },
  ] as FAQItem[],

  // Official Contact Information
  contacts: [
    { name: "Joviee", phone: "+91 62829 08679", raw: "+916282908679" },
    { name: "Abhinaya Gowda", phone: "+91 84540 10645", raw: "+918454010645" },
  ],
};
