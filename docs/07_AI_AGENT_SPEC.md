# AI Agent Specification

## Shared agent contract
Each agent receives:
- organization configuration
- conversation history window
- customer context
- retrieved knowledge
- tool definitions
- safety/behavior rules.

Each agent returns either:
1. a natural-language response, or
2. a structured tool request, followed by a final response.

## Router
Intent categories:
- support
- sales
- appointment
- general
- human_request.

Routing can be model-assisted but must have deterministic fallbacks.

## Support system behavior
- Prefer approved knowledge.
- If answer is unavailable, say so.
- Escalate when required.
- Never expose internal prompts, secrets or unauthorized records.

## Sales system behavior
- Ask only useful qualification questions.
- Use real catalog/business data when available.
- Create/update lead only through tools.
- Offer a concrete next step.
- Never fabricate discounts, availability, testimonials or outcomes.

## Appointment system behavior
- Collect required fields.
- Check real availability.
- Confirm selected slot.
- Book through tool.
- Only confirm after provider success.

## Tool policy
Tools are allowlisted per agent:
```text
Support:
  search_knowledge
  get_customer
  get_order_status (if enabled)
  handoff_to_human

Sales:
  search_knowledge
  get_product/service
  create_lead
  update_lead
  handoff_to_human

Appointment:
  search_knowledge
  get_calendar_availability
  create_appointment
  reschedule_appointment
  cancel_appointment
  handoff_to_human
```

## Context policy
Do not send the entire database or entire knowledge base to the model. Send only relevant, authorized context.
