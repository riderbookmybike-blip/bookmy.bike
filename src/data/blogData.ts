export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // Markdown supported
    author: string;
    date: string;
    readTime: string;
    imageUrl: string;
    tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
    {
        id: '1',
        slug: 'next-gen-bajaj-chetak-evolution',
        title: 'Next-Gen Bajaj Chetak: Evolution in Motion',
        excerpt: 'Bajaj is set to redefine urban mobility with the launch of the next-generation Chetak. Discover the design overhauls and technical upgrades that mark a new era for this iconic electric scooter.',
        content: `
Bajaj Auto is poised to turn a new page in its electric journey today with the launch of the next-generation **Chetak**. As urban mobility demands grow, so does the need for smarter, more efficient machines. The new Chetak isn't just a facelift; it's a calculated evolution designed to enhance both aesthetics and ride quality.

## A Fresh Design Language

The most striking visual update is the rear profile. Gone is the split-type tail lamp of its predecessor, replaced by a sleek, **single-piece horizontally stacked tail lamp** that emphasizes the scooter's width and premium stance. The branding details have been refined, with 'Chetak' lettering neatly integrated into the headlamp and tail sections, exhibiting a level of fit and finish expected from a legacy brand.

## Mechanical Overhaul

Under the metal skin lies the real story. Bajaj has moved away from the complex single-sided front fork, opting for **conventional telescopic forks**. This shift promises a more compliant ride, better capable of handling our varied road conditions.

Furthermore, the drivetrain sees a significant shift:
- **Old**: Swingarm-mounted motor.
- **New**: Hub-mounted unit.

This transition suggests a focus on efficiency and perhaps a cleaner packaging solution. While the beloved classic silhouette remains, the mechanicals are thoroughly modern.

## High-Tech Dashboard

Spy shots suggest the test mules were running LCD units, but insiders point to a **high-spec TFT display** for the top-tier variant. Expect navigation, phone connectivity, and perhaps even customizable themes to match the scooter's premium positioning.

With pricing expected to be competitive, the new Chetak is ready to take on the electric heavyweights once again.
    `,
        author: 'Anuj Mishra',
        date: 'Jan 14, 2026',
        readTime: '3 min read',
        imageUrl: 'https://images.unsplash.com/photo-1623087285608-013143c7b8df?q=80&w=2670&auto=format&fit=crop', // Abstract generic scooter/tech image
        tags: ['EV', 'Bajaj', 'Launch']
    },
    {
        id: '2',
        slug: 'tvs-ntorq-150-performance-arrives',
        title: 'TVS Ntorq 150: The Performance Scooter Arrives',
        excerpt: 'TVS ups the ante with the Ntorq 150, delivering 13bhp and segment-first features like adjustable levers. A closer look at the aggressive styling and tech-loaded package.',
        content: `
The wait is over. TVS has officially launched the **Ntorq 150**, effectively setting a new benchmark for the performance scooter segment in India. With a starting price of **Rs. 1.19 Lakh** (ex-showroom, Bengaluru), it bridges the gap between everyday practicality and enthusiast-level thrills.

## Aggressive Styling

While unmistakably an Ntorq, the 150cc sibling wears a much more aggressive suit. The **quad LED projector headlights** give it a menacing face, flanked by sharp LED DRLs. The body panels are sculpted with aerodynamics in mind, and the split tail-light setup at the rear ensures you know exactly what just passed you.

## The Powerhouse

At its heart sits a **149.7cc, air-cooled, 3-valve engine**.
- **Power**: 13 bhp
- **Torque**: 14.2 Nm
- **Top Speed**: 104 kmph (claimed)

It's not just about raw numbers; it's about delivery. Paired with a tuned CVT, the Ntorq 150 promises linear yet punchy acceleration, perfect for city traffic light dashes.

## Segment-First Features

TVS is known for loading their machines with tech, and the Ntorq 150 is no exception.
1.  **Adjustable Brake Levers**: A first in this segment, allowing riders to fine-tune ergonomics.
2.  **Traction Control**: Safety meets performance.
3.  **TFT Console**: A full-colour display on the top variant with Bluetooth connectivity and navigation.
4.  **Ride Modes**: Switch between *Street* and *Race* to alter the scooter's character on the fly.

With single-channel ABS standard and a chassis tuned for cornering, the Ntorq 150 is built for those who love to ride.
    `,
        author: 'Rishabh Bhaskar',
        date: 'Jan 14, 2026',
        readTime: '4 min read',
        imageUrl: 'https://images.unsplash.com/photo-1568772585407-24af75b252ca?q=80&w=2574&auto=format&fit=crop', // Dynamic bike/speed image
        tags: ['TVS', 'Performance', 'Launch']
    }
];
