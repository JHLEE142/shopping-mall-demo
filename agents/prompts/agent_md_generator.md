# Agent Markdown Generator Prompt

This is a meta-prompt for generating agent specification markdown files.

## Purpose

Generate complete agent specification markdown files that serve as the Single Source of Truth (SSoT) for agent behavior.

## Structure Template

Each agent specification must include these 8 sections in order:

1. **Role** - Agent's primary responsibility (1-2 sentences)
2. **Goals** - Numbered list of specific objectives (3-5 items)
3. **Inputs** - Required input parameters with types and descriptions
4. **Outputs** - Expected output format with types
5. **Guardrails** - Rules, constraints, validation criteria (detailed)
6. **Procedure** - Step-by-step execution flow (numbered)
7. **Examples** - Concrete input/output examples (JSON format)
8. **Failure Tags** - Error classification tags

## Key Principles

- **No abstraction**: Avoid vague terms like "appropriately", "situationally"
- **Actionable**: Each rule must be implementable without interpretation
- **Complete**: One markdown file should be sufficient for implementation
- **Specific**: Include exact thresholds, formulas, and decision criteria

## Quality Checklist

- [ ] All 8 sections present
- [ ] Guardrails include specific thresholds and formulas
- [ ] Examples show real input/output pairs
- [ ] Failure tags cover all error scenarios
- [ ] No ambiguous language
- [ ] All numbers and ranges specified

