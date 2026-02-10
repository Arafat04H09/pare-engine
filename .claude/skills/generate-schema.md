---
name: generate-schema
description: Generate vertical-specific JSON-LD schema markup for a business
user-invocable: true
---

# Generate Schema

Generate complete, interconnected JSON-LD structured data for a business.

## Steps

1. Ask the user for: business name, vertical (dental/legal/hvac/etc.), website URL, and any available business details (address, phone, hours, services)
2. Use the schema-org-mcp server to look up the required types for this vertical:
   - Query the base types: Organization, LocalBusiness, WebSite, BreadcrumbList
   - Query the vertical-specific types (e.g., Dentist, FAQPage, MedicalProcedure for dental)
   - Get all properties for each type including inherited properties
3. Generate complete JSON-LD with:
   - Interconnected `@graph` structure (Organization → LocalBusiness → Service → Review)
   - All required properties filled with provided data or placeholder markers
   - OpeningHoursSpecification if hours are provided
   - AggregateRating if review data is available
4. Validate the output against schema.org specifications
5. Present the JSON-LD to the user with implementation instructions

## Schema Type Reference

| Vertical | Required Types |
|----------|---------------|
| dental | Dentist, FAQPage, MedicalProcedure, OpeningHoursSpecification |
| legal | LegalService, Attorney, FAQPage, Person |
| hvac | HomeAndConstructionBusiness, Service, FAQPage, Offer |
| accounting | ProfessionalService, AccountingService, FAQPage |
| restaurant | Restaurant, Menu, FAQPage, AggregateRating |
| medical | MedicalBusiness, Physician, MedicalProcedure, FAQPage |
| real_estate | RealEstateAgent, RealEstateListing, FAQPage, Place, Offer |

## Notes
- This is Pare's technical moat — no CMS plugin generates vertical-specific schema
- Output should be ready to paste into a `<script type="application/ld+json">` tag
- Include comments explaining each section for client education
