export interface SlideContent {
  id: number;
  title: string;
  subtitle?: string;
  body: string[];
  layout: string;
  visualDirection: string;
  speakerNotes: string;
  accentColor?: string;
}

export const SLIDES: SlideContent[] = [
  {
    id: 1,
    title: "Beauty Brand AI Empire Builder",
    subtitle: "158+ Premium AI Prompts to Build, Scale & Dominate the Beauty Industry",
    body: [
      "Your AI-Powered Secret Weapon for Beauty Brand Success",
      "COMMERCIAL LICENSE INCLUDED"
    ],
    layout: "Premium Hero Slide",
    visualDirection: "Gradient background (Plum to Midnight), rose gold accents, subtle botanical decorative elements, large serif typography.",
    speakerNotes: "Welcome to the future of beauty brand building. Today, I'm introducing the Beauty Brand AI Empire Builder—a collection of over 158 premium prompts designed to help you dominate the industry. Whether you're starting from scratch or scaling to seven figures, this is your secret weapon, and it comes with a full commercial license for your client work."
  },
  {
    id: 2,
    title: "Building a Beauty Brand Is Expensive, Overwhelming, and Most Fail.",
    body: [
      "Consultants cost $5K–$15K per project; agencies $3K–$8K/month.",
      "Information overload with no clear system.",
      "80%+ failure rate due to poor strategy.",
      "Months wasted guessing instead of executing.",
      "Everyone says 'use AI' but nobody teaches what to ask for beauty results."
    ],
    layout: "Pain Points List",
    visualDirection: "Dark, moody background (Midnight Blue), high-contrast text, warning icons for each point, dramatic 'What if' footer.",
    speakerNotes: "Let's be honest: the traditional path to building a beauty brand is broken. You're looking at tens of thousands in consulting fees, or months of guessing while your competitors pass you by. Most brands fail not because they lack passion, but because they lack a proven strategy. What if you could access those same 7-figure strategies for less than the cost of a dinner out?"
  },
  {
    id: 3,
    title: "The Solution: Your All-In-One Beauty Strategy Dashboard",
    subtitle: "158+ Expert Prompts Across 8 Critical Categories",
    body: [
      "Product Strategy (25 Prompts)",
      "Content Creation (30 Prompts)",
      "Marketing & Sales (25 Prompts)",
      "Branding & Design (20 Prompts)",
      "Customer Engagement (20 Prompts)",
      "Analytics & Optimization (15 Prompts)",
      "Growth Hacking (13 Prompts)",
      "Operations (10 Prompts)"
    ],
    layout: "Visual Grid",
    visualDirection: "Clean grid layout, category icons, champagne and rose gold accents, central dashboard visual mockup.",
    speakerNotes: "Introducing the Beauty Brand AI Empire Builder. This isn't just a list of prompts; it's a comprehensive dashboard covering every single aspect of your business. From product formulation to viral growth hacking, we've distilled years of industry expertise into 158 copy-paste ready prompts that work with ChatGPT, Claude, or Gemini."
  },
  {
    id: 4,
    title: "3 Steps to Expert Strategy",
    subtitle: "No AI experience required.",
    body: [
      "1. Browse & Choose: Search, filter, and find exactly what you need.",
      "2. Copy & Paste: One-click copy, then customize simple placeholders.",
      "3. Get Expert Results: Detailed strategies in under 60 seconds."
    ],
    layout: "Step-by-Step Process",
    visualDirection: "Horizontal flow or numbered vertical list, elegant icons, plenty of white space, pearl white background.",
    speakerNotes: "We've made this incredibly simple. Step one: browse the dashboard to find the specific strategy you need. Step two: click to copy and fill in your brand details. Step three: paste into your favorite AI and watch it generate expert-level results in seconds. You don't need to be a prompt engineer; we've done the hard work for you."
  },
  {
    id: 5,
    title: "See It in Action: Prompt to Strategy in 60 Seconds",
    body: [
      "Prompt: 'Generate 5 innovative skincare product concepts for Gen Z...'",
      "Output: '1. Glow-Filter Serum: Niacinamide + Blue Light Protection...'",
      "One prompt. Five complete product concepts. Under 60 seconds.",
      "A consultant charges $2,000+ for this."
    ],
    layout: "Split Screen Proof",
    visualDirection: "Left side (Plum) shows the prompt, Right side (Champagne) shows the AI output, bold value callout at the bottom.",
    speakerNotes: "Take a look at this real-world example. On the left is a single prompt from our Product Strategy section. On the right is the result: five fully fleshed-out product concepts with names, ingredients, and USPs. A consultant would charge you thousands for this level of ideation, but you can do it in under a minute."
  },
  {
    id: 6,
    title: "Who Is This For?",
    body: [
      "Aspiring Founders: Launching your first brand.",
      "Existing Beauty Brands: Scaling from 6 to 7 figures.",
      "Beauty Influencers: Launching your own product line.",
      "Freelance Marketers: Delivering premium client work.",
      "Beauty Agencies: 10x output without 10x headcount.",
      "E-commerce Entrepreneurs: Better conversions and retention."
    ],
    layout: "6-Box Persona Grid",
    visualDirection: "Elegant cards for each persona, subtle hover effects, mix of Rose Gold and Deep Plum accents.",
    speakerNotes: "This empire builder is for anyone in the beauty space. Whether you're an aspiring founder launching your first serum, an influencer monetizing your audience, or an agency looking to scale your client deliverables without hiring more staff, these prompts provide the high-level strategy you need to win."
  },
  {
    id: 7,
    title: "5 Ways to Generate Revenue",
    body: [
      "Build Your Own Brand: Replace $50K in consulting fees.",
      "Done-For-You Services: Charge $500–$5,000 per project.",
      "Launch a Marketing Agency: $10K–$50K/month potential.",
      "Content Monetization: $1K–$10K/month through expert content.",
      "Consulting: Charge $100–$300/hour as an AI-powered expert."
    ],
    layout: "High-Impact Revenue List",
    visualDirection: "Most visually powerful slide, large numbers, gold/champagne accents, aspirational imagery (luxury office/products).",
    speakerNotes: "This is more than a tool; it's a revenue generator. You can use it to build your own empire and save fifty thousand dollars in consulting, or you can sell these services to others. Imagine charging five thousand dollars for a brand strategy that took you ten minutes to generate. The ROI here is astronomical."
  },
  {
    id: 8,
    title: "The Value Is Unmatched",
    subtitle: "Traditional Costs vs. Your Investment",
    body: [
      "Brand Strategy: $5K–$15K",
      "Content Agency: $9K–$24K",
      "Marketing Specialist: $4.5K–$15K",
      "Branding Agency: $5K–$20K",
      "Total Traditional Cost: $35,000–$114,000",
      "YOUR PRICE: $47"
    ],
    layout: "Comparison Table",
    visualDirection: "Dramatic contrast, traditional costs in muted tones, $47 price in massive Rose Gold font with glow effect.",
    speakerNotes: "If you went out and hired a team to do everything this dashboard covers, you'd be looking at a bill of over thirty-five thousand dollars at the absolute minimum. We're talking about expert-level branding, marketing, and operations. But today, you get lifetime access to all of it for just forty-seven dollars. That's less than thirty cents per prompt."
  },
  {
    id: 9,
    title: "A Premium Interactive Experience",
    subtitle: "Not Just a List of Prompts",
    body: [
      "Luxury Dashboard Design",
      "Smart Search & Filtering",
      "One-Click Copy to Clipboard",
      "Progress Tracking Bar",
      "Favorites & Bookmarks",
      "JSON/CSV Export",
      "Mobile Responsive",
      "Works Offline",
      "Free Lifetime Updates"
    ],
    layout: "Feature Icon Grid",
    visualDirection: "Minimalist icons, clean typography, Pearl White background with Rose Gold borders.",
    speakerNotes: "This isn't a messy PDF or a boring spreadsheet. It's a premium, interactive HTML dashboard. It features smart search, one-click copying, progress tracking to see how much of the system you've implemented, and it even works offline. Plus, you get every future update we release for free, forever."
  },
  {
    id: 10,
    title: "Built on Trust & Expertise",
    body: [
      "Crafted by Beauty Industry Strategists.",
      "Tested on Real-World Brand Scenarios.",
      "Covers the Complete Business Lifecycle.",
      "Works with All Major AI Tools.",
      "Commercial License Included.",
      "Instant Download & Lifetime Access."
    ],
    layout: "Trust Signals List",
    visualDirection: "Checkmark icons in Rose Gold, elegant serif headers, placeholder for testimonials.",
    speakerNotes: "You can trust these prompts because they weren't written by AI—they were written by beauty industry veterans and then optimized for AI. They've been tested in real-world scenarios to ensure the outputs are actionable and professional. And remember, that commercial license means you can use these outputs for your clients legally."
  },
  {
    id: 11,
    title: "Frequently Asked Questions",
    body: [
      "Q: Not tech-savvy? A: If you can copy and paste, you can use this.",
      "Q: Will AI give good results? A: Yes, because these prompts are expert-crafted.",
      "Q: Can I use for clients? A: Yes, a full commercial license is included.",
      "Q: Already have a brand? A: Our growth and analytics sections are built for you.",
      "Q: Is this a subscription? A: No. One-time payment, lifetime access."
    ],
    layout: "Q&A List",
    visualDirection: "Clean, readable layout, alternating background colors for rows (Lavender/Pearl White).",
    speakerNotes: "I know you might have questions. The most common one is 'is it hard to use?' The answer is no—if you can copy and paste, you're ready. Whether you're a total beginner or an existing brand owner, this system is designed to meet you where you are and take you to the next level without any recurring fees."
  },
  {
    id: 12,
    title: "Get Instant Access Now",
    subtitle: "Start Building Your Empire in 60 Seconds",
    body: [
      "158+ Premium Prompts",
      "8 Business Categories",
      "Interactive Dashboard",
      "Commercial License",
      "Lifetime Updates",
      "Regular Price: $297",
      "TODAY'S PRICE: $47"
    ],
    layout: "Pricing Card",
    visualDirection: "Central high-conversion card, Rose Gold CTA button, strikethrough pricing, 'Instant Download' badge.",
    speakerNotes: "It's time to stop guessing and start building. For just forty-seven dollars, you get the full collection of 158 prompts, the interactive dashboard, the commercial license, and lifetime updates. Click the button below to get instant access and start generating your 7-figure beauty strategy in the next sixty seconds."
  },
  {
    id: 13,
    title: "Don't Let Your Competitors Get Ahead",
    body: [
      "While you're deciding, competitors are launching with AI.",
      "While you're saving this for later, someone else is building your dream brand.",
      "158 Prompts. 8 Categories. Everything you need.",
      "$47. Right now."
    ],
    layout: "Urgency Slide",
    visualDirection: "High-contrast (Midnight Blue background), bold typography, dramatic lighting effects, repeated CTA.",
    speakerNotes: "The beauty industry moves fast. Every day you wait is a day your competitors are using tools like this to move ten times faster than you. Don't let someone else build the brand you've been dreaming about. Take action now, secure the lifetime price, and start building your empire today."
  },
  {
    id: 14,
    title: "Your Beauty Empire Starts With One Click.",
    subtitle: "Stop Guessing. Start Building.",
    body: [
      "158+ Expert Prompts",
      "8 Business Categories",
      "Unlimited Potential",
      "whop.com/beauty-ai-empire",
      "support@beautyaiempire.com"
    ],
    layout: "Closing Slide",
    visualDirection: "Elegant final hero, social handles, contact info, copyright line, soft botanical background.",
    speakerNotes: "Thank you for your time. Your beauty empire is waiting, and it all starts with one click. Head over to our Whop page, grab your copy, and let's build something incredible together. If you have any questions, our team is always here to help. I'll see you inside the dashboard."
  }
];
