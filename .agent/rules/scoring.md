# Scoring Rules

## Canonical Weights
The system uses a 100-point 5-pillar scoring model:
- **AI Visibility**: 30%
- **Content Quality**: 30%
- **Schema Completeness**: 15%
- **Technical Readiness**: 10%
- **Local GBP**: 15%

## Implementation Constraints
1. **Precision**: Final pillar scores must be `Math.round()` and capped at their max weight.
2. **Persistence**: Scores are stored in the `audit_results` table in the database.
3. **Logic Location**: All scoring logic resides in `packages/core/src/scoring/`.
4. **Calculations**: Overall score equals sum of pillar scores.
