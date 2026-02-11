---
name: create-n8n-workflow
description: Generate an n8n workflow using the n8n-MCP server
user-invocable: true
---

# Create n8n Workflow

Use the n8n-MCP server to generate production-ready n8n workflows from natural language descriptions.

## Prerequisites
- n8n-MCP server installed (`czlonkowski/n8n-mcp`)
- n8n-skills installed (`czlonkowski/n8n-skills`)

## Steps

1. Ask the user what the workflow should do (trigger, actions, conditions)
2. Use the n8n-MCP server to:
   - Look up relevant nodes for the task
   - Understand node configurations and connection patterns
3. Generate the workflow JSON
4. Test by importing into n8n (paste JSON in workflow editor)
5. Save the workflow JSON to `n8n-workflows/` directory

## Common Workflows for Pare
- **Weekly monitoring trigger:** Cron → fetch client list → trigger Inngest audit event per client
- **Mini-audit webhook:** Webhook → validate form data → trigger Inngest mini-audit event
- **Audit completion notification:** Webhook (from Inngest) → send Slack/email notification
- **Monthly report trigger:** Cron (1st of month) → fetch retainer clients → trigger monthly report generation

## Notes
- n8n handles scheduling and webhooks ONLY
- Long-running work (audit pipeline) goes through Inngest, not n8n
- n8n's 5-minute MCP timeout means it can't execute the audit pipeline directly
