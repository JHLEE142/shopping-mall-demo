# JSONL Generator Prompt

This is a meta-prompt for generating fine-tuning data in JSONL format.

## Purpose

Generate instruction-following datasets for fine-tuning LLMs to act as specific agents.

## Format

Each line is a JSON object with:

```json
{
  "instruction": "System prompt based on agent spec",
  "input": "User message or context",
  "output": "Expected agent response (in standard format)"
}
```

## Generation Rules

1. **Instruction**: Build from agent spec's Role, Goals, and Guardrails
2. **Input**: Use realistic user messages or agent inputs
3. **Output**: Must match one of the standard response types:
   - ANSWER
   - BRIEFING_WITH_PRODUCTS
   - MONGO_QUERY
   - TOOL_CALL
   - NEED_MORE_INFO

## Quality Criteria

- **Completeness**: All required fields present
- **Accuracy**: Output matches agent spec exactly
- **Consistency**: Format matches response_schema.json
- **Diversity**: Cover edge cases, normal cases, and failures
- **Realism**: Inputs should be natural user messages

## PII Masking

- Email: `user@[MASKED].com`
- Phone: `010-****-5678`
- Address: `서울시 [MASKED]구...`
- Name: `[NAME]`
- SSN: `[SSN]`
- Account: `[ACCOUNT]`

