# Callback Summary Template

Use this template for all PM, supervisor, and worker callbacks.

```md
[角色]#模块@版本
⟦tag:v2|session|<session-id>⟧
task tag: ⟦tag:v2|task|<task-id>⟧
role tag: ⟦tag:v2|role|<role-id>⟧
loop state: waiting_callback
dispatch state: waiting_callback

completed:
- ...

incomplete:
- ...

blockers:
- ...

next action:
- ...

evidence:
- file / artifact / command evidence only
```

callback rules:
- Evidence must be concrete: file path, command result, browser check, or artifact.
- Do not paste full diffs unless PM requested review or conflict analysis.
- If verification was not run, say which gate is missing.
- If a task is blocked by quota, credentials, missing executable, or missing truth source, do not describe it as active implementation.
- If the short-worker cannot close today, mark it `blocked` or `waiting_callback` and open a new short-worker next day.
