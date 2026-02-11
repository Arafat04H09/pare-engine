# MCP Configuration for Pare Engine

This document tracks the MCP servers integrated into the Pare Engine agentic workflow.

## Active MCP Servers

### 1. Google Search (`google-search`)
- **Purpose**: High-volume web research for the `research` and `search-tools` skills.
- **Tools**: `search`, `list_sites`.

### 2. GitHub (`github`)
- **Purpose**: Managing repository issues and PRs during the `build` phase.
- **Tools**: `create_issue`, `list_pull_requests`.

### 3. File Search (`file-search`)
- **Purpose**: Deep code analysis during `gap-analysis` and `synthesize`.
- **Tools**: `deep_grep`, `find_pattern`.

## Integration Points

| Skill | MCP Server | Tools Used |
| :--- | :--- | :--- |
| **gap-analysis** | `file-search` | `deep_grep` |
| **research** | `google-search` | `search` |
| **synthesize** | `file-search` | `deep_grep`, `find_pattern` |
| **search-tools** | `google-search` | `search` |
| **build** | `github` | `create_issue` |
| **confirm** | `file-search` | `deep_grep` |
