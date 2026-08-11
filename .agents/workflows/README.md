# Workflows

Repetitive tasks (release, git, validation, scaffolding, ...) are codified here as YAML files. One file per task family, e.g. `release.yaml`, `git.yaml`.

## Format

```yaml
name: <workflow-name>
description: <when to run this workflow>

triggers:
  - <what starts it>

steps:
  - <ordered step>
  - <ordered step>

verify:
  - <how to prove success>
```

## Rules (from AGENTS.md §6)

- Add or update a workflow the moment a task has been done twice.
- Workflows are the single source of truth for how a repetitive task is done — never improvise a task that has a workflow.
- Update the workflow when the task changes.
