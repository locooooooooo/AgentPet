# 多 Agent 牛马编排索引

[PM]#multi-agent-control@v0.1

loop state: active
dispatch state: active

read order:
1. `docs/orchestration/index.md`
2. `docs/orchestration/roles/pm.md`
3. `docs/orchestration/roles/supervisor.md`
4. tracked task cards under `docs/orchestration/tasks/`
5. tracked session cards under `docs/orchestration/sessions/`

tracked control cards:
- role: ⟦tag:v2|role|pm-control-v0.1⟧ -> `docs/orchestration/roles/pm.md`
- role: ⟦tag:v2|role|supervisor-control-v0.1⟧ -> `docs/orchestration/roles/supervisor.md`
- startup: `docs/orchestration/startup-prompt.md`
- callback template: `docs/orchestration/callback-summary-template.md`
- connector schema: `docs/orchestration/connectors.schema.json`
- connector config: `docs/orchestration/connectors.json`

tracked business cards:
- task: ⟦tag:v2|task|multi-agent-runtime-v0.1⟧ -> `docs/orchestration/tasks/multi-agent-runtime-v0.1.md`
- task: ⟦tag:v2|task|connector-policy-v0.1⟧ -> `docs/orchestration/tasks/connector-policy-v0.1.md`
- task: ⟦tag:v2|task|connector-acceptance-review-v0.1⟧ -> `docs/orchestration/tasks/connector-acceptance-review-v0.1.md`
- task: ⟦tag:v2|task|codex-evidence-closeout-v0.1⟧ -> `docs/orchestration/tasks/codex-evidence-closeout-v0.1.md`
- task: ⟦tag:v2|task|runtime-connector-dispatch-v0.1⟧ -> `docs/orchestration/tasks/runtime-connector-dispatch-v0.1.md`
- task: ⟦tag:v2|task|runtime-blocked-path-closeout-v0.1⟧ -> `docs/orchestration/tasks/runtime-blocked-path-closeout-v0.1.md`
- task: ⟦tag:v2|task|daily-decision-queue-2026-07-02⟧ -> `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md`
- task: ⟦tag:v2|task|daily-role-accountability-2026-07-02⟧ -> `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md`
- task: ⟦tag:v2|task|git-repair-agentpet-v0.1⟧ -> `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`
- task: ⟦tag:v2|task|git-staging-review-agentpet-v0.1⟧ -> `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md`
- task: ⟦tag:v2|task|ranch-m4-requirements-v0.2⟧ -> `docs/orchestration/tasks/ranch-m4-requirements-v0.2.md`
- task: ⟦tag:v2|task|ranch-m4-implementation-v0.2⟧ -> `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`
- task: ⟦tag:v2|task|ranch-window-v0.1⟧ -> `docs/orchestration/tasks/ranch-window-v0.1.md`
- task: ⟦tag:v2|task|ranch-status-script-v0.1⟧ -> `docs/orchestration/tasks/ranch-status-script-v0.1.md`
- task: ⟦tag:v2|task|ranch-personality-v0.1⟧ -> `docs/orchestration/tasks/ranch-personality-v0.1.md`
- task: ⟦tag:v2|task|ranch-m5-requirements-v0.2⟧ -> `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`
- task: ⟦tag:v2|task|ranch-window-v0.2⟧ -> `docs/orchestration/tasks/ranch-window-v0.2.md`
- task: ⟦tag:v2|task|ranch-status-script-v0.2⟧ -> `docs/orchestration/tasks/ranch-status-script-v0.2.md`
- task: ⟦tag:v2|task|ranch-personality-v0.2⟧ -> `docs/orchestration/tasks/ranch-personality-v0.2.md`
- task: ⟦tag:v2|task|ranch-fence-pointer-v0.2⟧ -> `docs/orchestration/tasks/ranch-fence-pointer-v0.2.md`
- task: ⟦tag:v2|task|ranch-system-notify-v0.2⟧ -> `docs/orchestration/tasks/ranch-system-notify-v0.2.md`
- task: ⟦tag:v2|task|ranch-pointer-smoke-v0.2⟧ -> `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md`
- task: ⟦tag:v2|task|ranch-pointer-smoke-manual-evidence-v0.2⟧ -> `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md`
- session: ⟦tag:v2|session|ranch-fence-pointer-v0.2-acceptance-2026-07-14⟧ -> `docs/orchestration/sessions/ranch-fence-pointer-v0.2-acceptance-2026-07-14.md`
- session: ⟦tag:v2|session|ranch-system-notify-v0.2-acceptance-2026-07-14⟧ -> `docs/orchestration/sessions/ranch-system-notify-v0.2-acceptance-2026-07-14.md`
- task: ⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧ -> `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
- task: ⟦tag:v2|task|ranch-real-integration-r0-3-dryrun-v0.1⟧ -> `docs/orchestration/tasks/ranch-real-integration-r0-3-dryrun-v0.1.md`
- task: ⟦tag:v2|task|protected-cockpit-source-drift-v0.1⟧ -> `docs/orchestration/tasks/protected-cockpit-source-drift-v0.1.md`
- session: ⟦tag:v2|session|protected-cockpit-source-drift-closeout-2026-07-16⟧ -> `docs/orchestration/sessions/protected-cockpit-source-drift-closeout-2026-07-16.md`
- task: ⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧ -> `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`
- task: ⟦tag:v2|task|cockpit-ui-redesign-v3.1-v0.1⟧ -> `docs/orchestration/tasks/cockpit-ui-redesign-v3.1-v0.1.md`
- task: ⟦tag:v2|task|cockpit-ui-redesign-v3.2-v0.1⟧ -> `docs/orchestration/tasks/cockpit-ui-redesign-v3.2-v0.1.md`
- session: ⟦tag:v2|session|cockpit-ui-redesign-v3.2-progress⟧ -> `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-progress.md`
- session: ⟦tag:v2|session|cockpit-ui-redesign-v3.2-acceptance-2026-07-13⟧ -> `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-acceptance-2026-07-13.md`
- session: ⟦tag:v2|session|cockpit-ui-redesign-v3.2-p1-progress-2026-07-16⟧ -> `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-p1-progress-2026-07-16.md`
- session: ⟦tag:v2|session|cockpit-ui-redesign-v3.2-p2-progress-2026-07-16⟧ -> `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-p2-progress-2026-07-16.md`
- session: ⟦tag:v2|session|cockpit-ui-redesign-v3.2-p1-p2-acceptance-2026-07-17⟧ -> `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-p1-p2-acceptance-2026-07-17.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-a-connector-runtime-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-a-connector-runtime-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-b-data-truth-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-b-data-truth-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-c-codex-acceptance-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-c-codex-acceptance-v0.1.md`
- task: ⟦tag:v2|task|realtime-p1-scheduler-intake-v0.1⟧ -> `docs/orchestration/tasks/realtime-p1-scheduler-intake-v0.1.md`
- task: ⟦tag:v2|task|realtime-p1-scheduler-core-v0.1⟧ -> `docs/orchestration/tasks/realtime-p1-scheduler-core-v0.1.md`
- task: ⟦tag:v2|task|realtime-p1-scheduler-configurable-concurrency-v0.1⟧ -> `docs/orchestration/tasks/realtime-p1-scheduler-configurable-concurrency-v0.1.md`
- task: ⟦tag:v2|task|hub-r0-contract-freeze-v0.1⟧ -> `docs/orchestration/tasks/hub-r0-contract-freeze-v0.1.md`
- task: ⟦tag:v2|task|hub-agent-lifecycle-p0-v0.1⟧ -> `docs/orchestration/tasks/hub-agent-lifecycle-p0-v0.1.md`
- task: ⟦tag:v2|task|hub-agent-session-view-p0-5-v0.1⟧ -> `docs/orchestration/tasks/hub-agent-session-view-p0-5-v0.1.md`
- task: ⟦tag:v2|task|hub-theme-contract-v0.1⟧ -> `docs/orchestration/tasks/hub-theme-contract-v0.1.md`
- task: ⟦tag:v2|task|hub-sound-pack-contract-v0.1⟧ -> `docs/orchestration/tasks/hub-sound-pack-contract-v0.1.md`
- task: ⟦tag:v2|task|hub-next-stage-requirements-v0.1⟧ -> `docs/orchestration/tasks/hub-next-stage-requirements-v0.1.md`
- task: ⟦tag:v2|task|hub-agent-library-m1-v0.1⟧ -> `docs/orchestration/tasks/hub-agent-library-m1-v0.1.md`
- task: ⟦tag:v2|task|hub-agent-install-plan-review-m1-v0.1⟧ -> `docs/orchestration/tasks/hub-agent-install-plan-review-m1-v0.1.md`
- task: ⟦tag:v2|task|hub-agent-version-evidence-m1-v0.1⟧ -> `docs/orchestration/tasks/hub-agent-version-evidence-m1-v0.1.md`
- task: ⟦tag:v2|task|hub-adapter-capability-implementation-v0.1⟧ -> `docs/orchestration/tasks/hub-adapter-capability-implementation-v0.1.md`
- task: ⟦tag:v2|task|hub-install-run-core-v0.1⟧ -> `docs/orchestration/tasks/hub-install-run-core-v0.1.md`
- task: ⟦tag:v2|task|hub-dependency-workflow-core-v0.1⟧ -> `docs/orchestration/tasks/hub-dependency-workflow-core-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-a7-process-reattach-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-a7-process-reattach-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-a7-1-async-process-proof-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-a7-1-async-process-proof-v0.1.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-progress-2026-07-13⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-progress-2026-07-13.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-next-stage-2026-07-14⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-next-stage-2026-07-14.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-p0-a6-acceptance-2026-07-14⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-p0-a6-acceptance-2026-07-14.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-p0-a7-acceptance-2026-07-15⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-p0-a7-acceptance-2026-07-15.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-next-stage-2026-07-15⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-next-stage-2026-07-15.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-p0-b2-production-path-evidence-2026-07-15⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-p0-b2-production-path-evidence-2026-07-15.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-p0-c-authorization-decision-2026-07-15⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-p0-c-authorization-decision-2026-07-15.md`
- session: `docs/orchestration/sessions/realtime-agent-cockpit-p0-a7-1-evidence-2026-07-15.md`
- task: ⟦tag:v2|task|m5-longworker-dispatch-v0.1⟧ -> `docs/orchestration/tasks/m5-longworker-dispatch-v0.1.md`
- task: ⟦tag:v2|task|homepage-ui-p0-v0.1⟧ -> `docs/orchestration/tasks/homepage-ui-p0-v0.1.md`
- task: ⟦tag:v2|task|homepage-ui-p0-dispatch-v0.1⟧ -> `docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`
- session: ⟦tag:v2|session|ranch-v0.2-2026-07-02⟧ -> `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`
- session: ⟦tag:v2|session|daily-supervision-2026-07-02⟧ -> `docs/orchestration/sessions/daily-supervision-2026-07-02.md`
- session: ⟦tag:v2|session|daily-plan-2026-07-03⟧ -> `docs/orchestration/sessions/daily-plan-2026-07-03.md`
- session: ⟦tag:v2|session|daily-plan-2026-07-09⟧ -> `docs/orchestration/sessions/daily-plan-2026-07-09.md`
- session: ⟦tag:v2|session|daily-plan-2026-07-10⟧ -> `docs/orchestration/sessions/daily-plan-2026-07-10.md`
- session: ⟦tag:v2|session|daily-supervision-2026-07-03⟧ -> `docs/orchestration/sessions/daily-supervision-2026-07-03.md`
- session: ⟦tag:v2|session|daily-longworker-dispatch-2026-07-03⟧ -> `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md`
- session: ⟦tag:v2|session|cockpit-statusstrip-2026-07-03⟧ -> `docs/orchestration/sessions/cockpit-statusstrip-2026-07-03.md`
- session: ⟦tag:v2|session|cockpit-visual-acceptance-2026-07-03⟧ -> `docs/orchestration/sessions/cockpit-visual-acceptance-2026-07-03.md`
- session: ⟦tag:v2|session|r0-evidence-reconcile-2026-07-03⟧ -> `docs/orchestration/sessions/r0-evidence-reconcile-2026-07-03.md`
- session: ⟦tag:v2|session|daily-closeout-2026-07-03⟧ -> `docs/orchestration/sessions/daily-closeout-2026-07-03.md`
- session: ⟦tag:v2|session|ranch-real-integration-p0-progress⟧ -> `docs/orchestration/sessions/ranch-real-integration-p0-progress.md`
- session: ⟦tag:v2|session|cockpit-refactor-p0-progress⟧ -> `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`
- session: ⟦tag:v2|session|r0-visual-replay-accepted-2026-07-04⟧ -> `docs/orchestration/sessions/r0-visual-replay-accepted-2026-07-04.md`
- session: ⟦tag:v2|session|cockpit-corner-assist-2026-07-04⟧ -> `docs/orchestration/sessions/cockpit-corner-assist-2026-07-04.md`
- session: ⟦tag:v2|session|cockpit-c0-6-accepted-2026-07-04⟧ -> `docs/orchestration/sessions/cockpit-c0-6-accepted-2026-07-04.md`
- session: ⟦tag:v2|session|r0-notification-icons-accepted-2026-07-04⟧ -> `docs/orchestration/sessions/r0-notification-icons-accepted-2026-07-04.md`
- session: ⟦tag:v2|session|r0-readme-closeout-2026-07-04⟧ -> `docs/orchestration/sessions/r0-readme-closeout-2026-07-04.md`
- session: ⟦tag:v2|session|r0-connector-decision-2026-07-04⟧ -> `docs/orchestration/sessions/r0-connector-decision-2026-07-04.md`
- session: ⟦tag:v2|session|git-manager-agentpet-2026-07-02⟧ -> `docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md`
- session: ⟦tag:v2|session|main-thread-2026-07-01-runtime-bootstrap⟧ -> `docs/orchestration/sessions/main-thread-2026-07-01-runtime-bootstrap.md`
- session: ⟦tag:v2|session|runtime-blocked-path-closeout-2026-07-01⟧ -> `docs/orchestration/sessions/runtime-blocked-path-closeout-2026-07-01.md`
- session: ⟦tag:v2|session|codex-evidence-closeout-2026-07-01⟧ -> `docs/orchestration/sessions/codex-evidence-closeout-2026-07-01.md`
- session: ⟦tag:v2|session|daily-closeout-2026-07-06⟧ -> `docs/orchestration/sessions/daily-closeout-2026-07-06.md`
- session: ⟦tag:v2|session|daily-closeout-2026-07-10⟧ -> `docs/orchestration/sessions/daily-closeout-2026-07-10.md`
- session: ⟦tag:v2|session|daily-supervision-2026-07-06⟧ -> `docs/orchestration/sessions/daily-supervision-2026-07-06.md`
- session: ⟦tag:v2|session|ranch-smoke-desktop-exe-2026-07-06⟧ -> `docs/orchestration/sessions/ranch-smoke-desktop-exe-2026-07-06.md`
- session: ⟦tag:v2|session|weekly-requirements-2026-07-07⟧ -> `docs/orchestration/sessions/weekly-requirements-2026-07-07.md`
- session: ⟦tag:v2|session|weekly-requirements-2026-07-14⟧ -> `docs/orchestration/sessions/weekly-requirements-2026-07-14.md`
- session: ⟦tag:v2|session|weekly-requirements-2026-07-21⟧ -> `docs/orchestration/sessions/weekly-requirements-2026-07-21.md`
- session: ⟦tag:v2|session|weekly-development-plan-2026-07-20⟧ -> `docs/orchestration/sessions/weekly-development-plan-2026-07-20.md`
- session: ⟦tag:v2|session|trae-qoder-connector-discovery-2026-07-16⟧ -> `docs/orchestration/sessions/trae-qoder-connector-discovery-2026-07-16.md`
- session: ⟦tag:v2|session|cockpit-live-session-notification-2026-07-16⟧ -> `docs/orchestration/sessions/cockpit-live-session-notification-2026-07-16.md`
- session: ⟦tag:v2|session|daily-plan-2026-07-17⟧ -> `docs/orchestration/sessions/daily-plan-2026-07-17.md`
- session: ⟦tag:v2|session|ranch-pointer-smoke-2026-07-17⟧ -> `docs/orchestration/sessions/ranch-pointer-smoke-2026-07-17.md`
- session: ⟦tag:v2|session|control-truth-projection-2026-07-17⟧ -> `docs/orchestration/sessions/control-truth-projection-2026-07-17.md`
- session: ⟦tag:v2|session|w28-closeout-readiness-2026-07-17⟧ -> `docs/orchestration/sessions/w28-closeout-readiness-2026-07-17.md`
- session: ⟦tag:v2|session|next-five-day-development-2026-07-18⟧ -> `docs/orchestration/sessions/next-five-day-development-2026-07-18.md`
- session: ⟦tag:v2|session|weekly-closeout-2026-07-20⟧ -> `docs/orchestration/sessions/weekly-closeout-2026-07-20.md`
- session: ⟦tag:v2|session|realtime-p1-scheduler-core-evidence-2026-07-17⟧ -> `docs/orchestration/sessions/realtime-p1-scheduler-core-evidence-2026-07-17.md`
- session: ⟦tag:v2|session|realtime-p1-scheduler-configurable-concurrency-evidence-2026-07-18⟧ -> `docs/orchestration/sessions/realtime-p1-scheduler-configurable-concurrency-evidence-2026-07-18.md`
- session: ⟦tag:v2|session|hub-r0-contract-freeze-2026-07-18⟧ -> `docs/orchestration/sessions/hub-r0-contract-freeze-2026-07-18.md`
- session: ⟦tag:v2|session|hub-agent-lifecycle-p0-2026-07-18⟧ -> `docs/orchestration/sessions/hub-agent-lifecycle-p0-2026-07-18.md`
- session: ⟦tag:v2|session|hub-agent-session-view-p0-5-2026-07-18⟧ -> `docs/orchestration/sessions/hub-agent-session-view-p0-5-2026-07-18.md`
- session: ⟦tag:v2|session|hub-blocker-remediation-2026-07-18⟧ -> `docs/orchestration/sessions/hub-blocker-remediation-2026-07-18.md`
- session: ⟦tag:v2|session|hub-next-stage-plan-2026-07-18⟧ -> `docs/orchestration/sessions/hub-next-stage-plan-2026-07-18.md`
- session: ⟦tag:v2|session|hub-content-contract-review-2026-07-19⟧ -> `docs/orchestration/sessions/hub-content-contract-review-2026-07-19.md`
- session: ⟦tag:v2|session|hub-agent-library-m1-2026-07-19⟧ -> `docs/orchestration/sessions/hub-agent-library-m1-2026-07-19.md`
- session: ⟦tag:v2|session|hub-agent-install-plan-review-m1-2026-07-19⟧ -> `docs/orchestration/sessions/hub-agent-install-plan-review-m1-2026-07-19.md`
- session: ⟦tag:v2|session|hub-agent-version-evidence-m1-2026-07-19⟧ -> `docs/orchestration/sessions/hub-agent-version-evidence-m1-2026-07-19.md`
- session: ⟦tag:v2|session|homepage-layout-density-2026-07-16⟧ -> `docs/orchestration/sessions/homepage-layout-density-2026-07-16.md`
- session: ⟦tag:v2|session|weekly-closeout-2026-07-11⟧ -> `docs/orchestration/sessions/weekly-closeout-2026-07-11.md`
- session: ⟦tag:v2|session|m5-five-day-development-2026-07-14⟧ -> `docs/orchestration/sessions/m5-five-day-development-2026-07-14.md`
- session: ⟦tag:v2|session|homepage-ui-p0-progress⟧ -> `docs/orchestration/sessions/homepage-ui-p0-progress.md`
- session: ⟦tag:v2|session|homepage-ui-p0-design-2026-07-07⟧ -> `docs/orchestration/sessions/homepage-ui-p0-design-2026-07-07.md`
- session: ⟦tag:v2|session|homepage-ui-p0-design-accepted-2026-07-07⟧ -> `docs/orchestration/sessions/homepage-ui-p0-design-accepted-2026-07-07.md`
- session: ⟦tag:v2|session|homepage-ui-p0-c0-6-style-2026-07-07⟧ -> `docs/orchestration/sessions/homepage-ui-p0-c0-6-style-2026-07-07.md`
- session: ⟦tag:v2|session|ranch-pointer-smoke-investigation-2026-07-07⟧ -> `docs/orchestration/sessions/ranch-pointer-smoke-investigation-2026-07-07.md`
- session: ⟦tag:v2|session|connector-decision-2026-07-07⟧ -> `docs/orchestration/sessions/connector-decision-2026-07-07.md`
- session: ⟦tag:v2|session|ranch-pointer-capture-2026-07-09⟧ -> `docs/orchestration/sessions/ranch-pointer-capture-2026-07-09.md`

recently closed cards:
- accepted blocked-path lanes: ⟦tag:v2|task|connector-types-v0.1⟧, ⟦tag:v2|task|connector-main-gate-v0.1⟧, ⟦tag:v2|task|connector-preload-api-v0.1⟧, ⟦tag:v2|task|connector-ui-binding-v0.1⟧
- accepted homepage lane: ⟦tag:v2|task|homepage-ui-p0-v0.1⟧ with evidence ⟦tag:v2|session|homepage-ui-p0-c0-6-style-2026-07-07⟧
- insufficient Codex acceptance evidence: ⟦tag:v2|task|codex-execution-evidence-v0.1⟧

dispatch gate:
- Dispatch only from an active task card, a waiting callback session, or an explicit user request.
- Default worker type is `[短工]` unless the user explicitly authorizes `[长工]`.
- PM owns dispatch, acceptance, correction, and close-out.
- Supervisor owns drift detection, blocker surfacing, and minimum correction.

current target:
- Next Hub milestone: close or explicitly defer M0 decisions, then deliver verified lifecycle support for 3 Agents and a real, cancellable, auditable dependency workflow across 2 accepted Headless Agents.

current role split:
- `[PM]#multi-agent-control@v0.1`: maintain this index, dispatch bounded lanes, collect callbacks, write acceptance.
- `[监督]#multi-agent-control@v0.1`: audit index/task/session consistency and stop drift.
- `[短工]#local-runner@v0.1`: desktop local command runner implementation and verification.
- `[短工]#orchestration-ui@v0.1`: show current role split and supervision state inside the control cockpit.
- `[短工]#connector-policy@v0.1`: bounded Trae adapter exists, but Trae remains draft/pending/disabled behind the Models blocker; Qoder is rejected/disabled because no headless API was found.
- `[PM]#connector-acceptance-review@v0.1`: standby decision-review package; Codex/Trae are not accepted, Qoder is rejected, and every production Connector remains disabled.
- `[短工]#runtime-dispatch-cards@v0.1`: control-card setup for blocked-safe connector runtime implementation lanes.
- `[短工]#runtime-blocked-path-closeout@v0.1`: close accepted blocked-path lanes and hold before execution binding.
- `[短工]#codex-evidence-closeout@v0.1`: record Codex evidence result and keep acceptance pending.
- `[PM]#daily-decision-queue@2026-07-02`: standby PM queue for Git staging/log decisions, connector acceptance, pointer smoke route, and R0-3 authorization; the historical live-subagent quota item was resolved by fresh 2026-07-17 bounded dispatch.
- `[PM]#daily-role-accountability@2026-07-02`: standby ledger mapping each role to state, evidence, and accountability action.
- `[长工]#ranch-m1-m2-correction@v0.2`: corrected ranch M1/M2 drift; accepted for M3 entry after code/build/browser/Electron prefs evidence.
- `[长工]#ranch-m3-plan@v0.2`: read-only M3 plan complete; superseded by two active M3 implementation owners.
- `[监督]#ranch-v0.2-audit@v0.2`: pre-correction audit complete; findings are superseded by the current corrected worktree evidence.
- `[长工]#m3-main-bridge@v0.2`: summarized M3 owner for main/preload/types/browser fallback.
- `[长工]#m3-ranch-entry@v0.2`: summarized M3 owner for ranch renderer interactions.
- `[长工]#git-manager@AgentPet`: standby Git-management owner for `https://github.com/locooooooooo/AgentPet.git`; thread `019f20fc-9b77-74f3-aa3d-ba8348cdec1c` supplied the historical diagnosis and then, after explicit user authorization, completed `fa9e08b Import AgentPet workspace` pushed to `origin/main`; PM has requested a post-push read-only callback.
- `[短工]#git-repair-agentpet@v0.1`: summarized historical Git repair boundary; the authorized import/push already completed, so this package must never rerun `git init`, remote add, or fetch against the current repository.
- `[PM]#git-staging-review-agentpet@v0.1`: standby review package for the currently observed valid Git repo and working-tree/index state; no stage, unstage, commit, push, reset, clean, or file removal before explicit decision.
- `[PM]#ranch-m4-requirements@v0.2`: summarized docs-only requirements readiness for M4 rename/control-cockpit linkage.
- `[长工]#ranch-m4-implementation@v0.2`: summarized M4 implementation long-worker; thread `019f227a-8978-7df1-8b3f-738ccdb01b18` completed rename/header settings scope and PM verified lint/build/orchestration/browser smoke.
- `[监督]#ranch-window@v0.1`: summarized M5 window evidence for FR-001/005/008/009/011 plus ranch 3-level UI convergence; manual transparent pointer smoke remains delegated to the standby verification packages.
- `[监督]#ranch-status-script@v0.1`: summarized M5 animal/status/single-toast notification evidence for FR-002/003/004/006 without reopening connector state.
- `[监督]#ranch-personality@v0.1`: summarized M5 personality and control-cockpit prefs-linkage evidence for FR-007 and notifyPrefs.
- `[短工]#ranch-m5-requirements@v0.2`: summarized historical readiness package superseded by completed M5 closeout `8df940c`; no child implementation card is reopened.
- `[PM]#m5-longworker-dispatch@v0.1`: summarized bounded dispatch package; all five M5 child cards are closed and no further product worker is authorized.
- `[PM]#m5-five-day-development@2026-07-14`: summarized five-day serial control card with status `completed_code_backed_with_manual_evidence_waived`; direct tray/pointer and Windows notification observations remain residual risk.
- `[监督]#ranch-pointer-smoke@v0.2`: standby after the 2026-07-17 evidence run; windows and gates passed, while real coordinate input remained blocked by `SetIsBorderRequired failed (0x80004002)` and the missing screenshot-bound input state.
- `[监督]#ranch-pointer-smoke-manual-evidence@v0.2`: standby evidence package; the 2026-07-17 run recorded click-through, double-click, right-click, drag and dock as blocked rather than passed, with Lane-owned processes cleaned.
- `[长工]#homepage-ui-design@v0.1`: summarized HomePage / landing / 启动页 P0 lane; H0-1 design drafts accepted as C · 华丽, H0-2/H0-3 implemented, H0-4 protected-file audit passed in `homepage-ui-p0-c0-6-style-2026-07-07.md`; no edit to `NiuMaAvatar.tsx` / `index.css` / `agentCore.ts` / central 4x2 control-cockpit grid.
- `[PM]#ranch-real-integration-r0-3-dryrun@v0.1`: standby R0-3 Codex controlled dry-run evidence lane; Codex machine fields stay unchanged, Trae stays draft/pending/disabled behind Models configuration, and Qoder stays disabled/rejected/command-empty; no dry-run starts without a second confirmation.
- `[PM]#protected-cockpit-source-drift@v0.1`: summarized after the 2026-07-16 fresh audit found no protected-source diff and both targeted/global diff checks passed; no source edit was manufactured.
- `[PM]#cockpit-ui-redesign-v3.1@v0.1`: summarized accepted visual-refinement lane pushed as `aa4cfa5`; future cockpit changes require a fresh bounded scope, while M5 lifecycle, protected animation/avatar, business logic, and connectors remain untouched.
- `[PM]#cockpit-ui-redesign-v3.2@v0.1`: summarized; P0 and independently replayed P1 `51d5501` / P2 `0dfaadf` are accepted/pushed, with reduced-motion active-profile and natural error-toast replay retained as non-blocking residual evidence.
- `[长工]#realtime-connector-runtime@v0.1`: standby after A1-A7.1/B2 controlled-process acceptance; no runtime worker is active and external Agent CLI execution remains forbidden.
- `[长工]#realtime-trusted-authorizer@v0.1`: summarized A6 owner; main-owned intent-bound single-use grants passed all negative paths, production policy remains blocked and external spawn stayed 0.
- `[长工]#realtime-process-reattach@v0.1`: summarized A7 owner; commit `e2031cd` proves process fingerprint/restart recovery and 10-second fail-closed behavior, and A7.1 `8866305` resolves the historical synchronous-CIM UI latency risk.
- `[长工]#realtime-production-path-e2e@v0.1`: summarized B2 owner; PM fresh async-CIM overlap passed at visible-DOM p95 `7ms` with child/proof-worker residue `0`.
- `[长工]#realtime-async-process-proof@v0.1`: summarized A7.1 owner; asynchronous identity proof and failure matrix are accepted/pushed as `8866305`.
- `[长工]#realtime-truth-ui@v0.1`: standby after partial acceptance of selector plus App/Home/Cockpit truth wiring, viewport replay, renderer SSR fixtures and Electron event latency; real E2E remains gated by P0-C.
- `[长工]#realtime-requirements-control@v0.1`: summarized historical control owner; A7.1/B2 are accepted and P0-C remains authorization-required under the current PM plan.
- `[PM]#realtime-cockpit-next-stage@2026-07-14`: summarized historical A7 authorization session.
- `[PM]#realtime-cockpit-next-stage@2026-07-15`: summarized historical P0-C authorization control session; A7.1/B2 control commit `74d8f50` is already pushed.
- `[PM]#weekly-requirements@2026-07-07`: summarized W27 (2026-07-07~2026-07-13) weekly-requirements history; final closeout is recorded in `weekly-closeout-2026-07-11.md`.
- `[PM]#weekly-requirements@2026-07-14`: summarized W28 planner after early closeout under the administrator's full schedule waiver; seven carry-over items remain non-blocking.
- `[PM]#weekly-requirements@2026-07-21`: summarized compressed-plan history; active weekly control moved to the 2026-07-20 development plan without rewriting this card's historical body.
- `[PM]#weekly-development-plan@2026-07-20`: active combined no-time-gate owner for the parallel foundation long workers, bounded integration and user-owned unified acceptance.
- `[长工]#hub-adapter-capability@v0.1`: active pure Adapter admission implementation owner; exact two-file fence, no external Agent execution and no acceptance claim.
- `[长工]#hub-install-run-core@v0.1`: active pure InstallRun Journal/cancel/recovery implementation owner; exact two-file fence and no machine effects.
- `[长工]#hub-dependency-workflow-core@v0.1`: active pure two-Agent dependency/cancel/audit implementation owner; exact two-file fence and fixture truth remains unaccepted.
- `[PM]#hub-agent-library-m1@v0.1`: summarized M1.1 read-only Agent Library; six registered candidates plus unbound host discovery are packaged and CDP verified, while InstallPlan/version probes and execution remain closed.
- `[PM]#hub-agent-install-plan-review-m1@v0.1`: summarized M1.2 review-only InstallPlan gate; strict validation and desktop/narrow packaged evidence pass, while publisher/artifact/version trust and all execution remain closed.
- `[PM]#hub-agent-version-evidence-m1@v0.1`: summarized M1.3 read-only version evidence; four registered lifecycle candidates plus unbound Kimi have live packaged version proof, while support and Connector gates remain unchanged.
- `[PM]#daily-plan@2026-07-17`: active daily supervision owner preserving prior closeout while the 2026-07-18 Hub control session drives the current bounded dispatch.
- `[PM]#cockpit-live-session-notification@2026-07-16`: summarized completed/pushed live Codex Desktop Session, Dock detail, completion bubble and sound evidence at `c21a60b`.
- `[监督]#control-truth-projection@2026-07-17`: summarized accepted visible projection of the 2026-07-17 target, roles, Lanes and blockers.
- `[PM]#w28-closeout-readiness@2026-07-17`: summarized readiness route for the 7-18 template, 7-19 pre-closeout audit and real 7-20 closeout time gate.
- `[PM]#next-five-day-development@2026-07-18`: summarized completed same-day serial control; all five original dates were delivered on the compressed 2026-07-17 DDL through `ccedb15`.
- `[PM]#weekly-closeout@2026-07-20`: summarized completed/pushed W28 closeout under the explicit full schedule waiver, with seven carry-over rows preserved as non-blocking.
- `[短工]#realtime-p1-scheduler-intake@v0.1`: summarized accepted requirements; the administrator's same-day DDL instruction satisfies the local scheduler phase-waiver branch only.
- `[长工]#realtime-p1-scheduler-core@v0.1`: summarized accepted/pushed local scheduler slice at `ccedb15`; S-01 through S-16 and R-01 through R-03 pass, max global/same-Agent/reserved are `1/1/1`, and external Agent spawn is `0`.
- `[短工]#realtime-p1-scheduler-configurable-concurrency@v0.1`: summarized accepted/pushed slice at `4508ce3`; S-01 through S-16, R-01 through R-03 and C-01 through C-12 pass with limits `1..4`, same-Agent reservation `1` and external Agent spawn `0`.
- `[PM]#daily-plan@2026-07-09`: summarized 2026-07-09 daily plan;B②/C short-worker/D 今天/E1 evidence is retained as history.
- `[PM]#daily-plan@2026-07-10`: summarized 2026-07-10 daily plan;administrator decisions and W28/closeout preparation are retained as history.

blockers:
- The selected-Agent Session slice is packaged and click-verified, but full DockView D0-D4 (free docking, persistence, profiles and Electron pop-outs) remains a separate unmet requirement.
- HubTheme/HubSoundPack contracts pass automated valid/invalid example checks and independent exact-file review; unaccepted product inputs and remaining synthetic avatar/status semantics still block broader R0 acceptance.
- M1.1 Agent Library, M1.2 review-only InstallPlan gate and M1.3 independent version evidence are packaged and verified, but full M1 still lacks an accepted executable Plan and three lifecycle rollback closures; none establishes Headless or workflow readiness.
- External connector execution remains disabled; Codex is draft/pending/discovery-only, Trae is draft/pending with `Models is required`, and Qoder is rejected/disabled because no independent headless Agent API exists.
- Real-time cockpit A6/A7.1, renderer truth and B2 controlled production slices are accepted only to the trusted/controlled-process boundary. P0-C real Agent E2E is still unexecuted; configured seeds, CLI discovery, controlled Node processes and simulated ticks must not be reported as online Agent sessions.
- The historical service-side `403 DAILY_LIMIT_EXCEEDED` is not current availability truth: bounded in-app short workers were dispatched successfully on 2026-07-17. This does not enable any external Connector.
- Control-cockpit central 4x2 grid and protected selling-point files remain locked; M4 header settings entry has been completed and accepted.
- Transparent Electron ranch pointer smoke remains incomplete: the 2026-07-17 Computer Use route enumerated both windows and eight animals, but screenshots failed with `SetIsBorderRequired failed (0x80004002)`, so safe coordinate input and direct click/drag/dock observation were blocked.

next action:
- Use `docs/orchestration/sessions/weekly-development-plan-2026-07-20.md` as the active no-time-gate execution source; run the three non-overlapping foundation long workers together and reserve final acceptance for the user.
- Use `docs/牛马Hub下一阶段需求与目标-v0.1-2026-07-18.md` as the canonical product and acceptance source; close or explicitly defer the remaining M0 decisions before expanding M1 beyond the accepted read-only Library slice.
- Preserve the packaged Session slice and open a separately fenced DockView D0 architecture probe before adding drag/drop, saved layouts or native pop-out windows.
- Preserve the independently accepted content-contract boundary, then reconcile product inputs and full UI truth; do not conflate R0 contract acceptance with R3 theme/sound product implementation.
- Preserve pushed A7.1/B2 control commit `74d8f50`; keep the runtime worker count at zero.
- Keep P0-C at `authorization_required_ready_for_decision` until a fresh explicit Codex execution authorization exists.
- Do not execute or enable any external Agent Connector from this control closeout.
- Keep M3 code gates accepted as passed after `lint`, `build`, and `orchestration:check`; use the identified Windows MCP Snapshot route only as capture evidence until full transparent-window pointer input is observed.
- Keep connector policy and `connector-acceptance-review-v0.1` on standby: do not rerun Trae before Models configuration plus fresh authorization, and do not reconsider Qoder before a headless API exists.
- Keep AgentPet Git log ignore / staging decisions behind explicit user confirmation. **2026-07-07 Git log ignore = ① 推 main 即可 已落档**(不引 pre-commit / pre-push hook,backup 为每周 manual 巡检);lane `git-staging-review-agentpet` 仍 standby 等待 PM/user 决定是否处理当前 Git state。The historical repair package is `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`; the current Git state review package is `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md` and remains standby.
- Preserve the accepted M4 evidence from thread `019f227a-8978-7df1-8b3f-738ccdb01b18`; future ranch work must open a new bounded lane.
- Keep `ranch-window-v0.1`, `ranch-status-script-v0.1`, and `ranch-personality-v0.1` summarized as M5 evidence cards; do not treat them as fresh active implementation lanes.
- Keep ranch pointer-smoke verification and `ranch-pointer-smoke-manual-evidence-v0.2` standby until a Windows route can create a screenshot-bound coordinate state; the 2026-07-17 blocked evidence is archived and no implementation defect was proved.
- Keep Codex and Trae `draft/pending/enabled=false`; keep Qoder `disabled/rejected/enabled=false` and command-empty.
- Use `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md` as the next PM callback surface for standby decisions.
- Keep `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md` aligned with role states before closing any daily supervision pass.
- M5 Day 5B correction `115c621` and final closeout `8df940c` are pushed to `origin/main`; preserve the residual-risk record and keep all M5 product lanes closed.
- Keep M5 product dispatch closed. Direct tray/pointer and Windows notification visibility may only reopen through fresh bounded evidence lanes.
- Preserve accepted scheduler commit `ccedb15`, its five-file selective integration and S/R regression evidence; no scheduler worker remains active.
- Preserve `4508ce3` and its shared-worktree plus isolated staged-snapshot evidence; open a new bounded card before priority/starvation, cancellation DAG or Connector quota work.
- Keep priority, starvation protection, cancellation DAG and Connector quotas outside this intake; preserve all seven W28 carry-over blockers separately.
