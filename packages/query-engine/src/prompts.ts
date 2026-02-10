export const VERTICAL_PROMPTS: Record<string, string[]> = {
    dental: [
        "Who is the best dentist in [city]?",
        "Recommend a cosmetic dentist near [city] for veneers",
        "Emergency dentist open now in [city]",
        "Affordable dental implants [city]",
        "Pediatric dentist recommendations [city]"
    ],
    legal: [
        "Best personal injury lawyer in [city]",
        "How much does a divorce lawyer cost in [city]?",
        "Estate planning attorney near [city]",
        "Top rated criminal defense lawyer [city]",
        "Worker's comp attorney [city]"
    ],
    hvac: [
        "Best HVAC company in [city]",
        "Emergency AC repair [city]",
        "Furnace replacement cost [city]",
        "Who repairs heat pumps in [city]?",
        "Reliable plumber and HVAC [city]"
    ]
};

export function generatePrompts(vertical: string, city: string): string[] {
    const templates = VERTICAL_PROMPTS[vertical] || VERTICAL_PROMPTS['dental']; // Fallback
    return templates.map(t => t.replace('[city]', city));
}
