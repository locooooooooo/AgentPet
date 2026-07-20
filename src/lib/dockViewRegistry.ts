/**
 * Bounded DockView D0 model.
 *
 * This module only describes view identity and projects UI state. It has no
 * persistence, IPC, Connector or Agent lifecycle side effects. D1-D4 layout
 * features (drag/drop, profiles and native windows) intentionally do not fit
 * in this model.
 */

export const DOCK_VIEW_LAYOUT_VERSION = 1 as const;

export type DockViewId = 'session-detail' | 'agent-library' | 'logs' | 'control-status';
export type DockViewRegion = 'operator' | 'header' | 'dock';

export interface DockViewDefinition {
  readonly id: DockViewId;
  readonly label: string;
  readonly region: DockViewRegion;
  readonly description: string;
  readonly order: number;
}

/** Stable registry order is part of the D0 contract. */
export const DOCK_VIEW_REGISTRY: readonly DockViewDefinition[] = [
  {
    id: 'session-detail',
    label: 'Session detail',
    region: 'operator',
    description: 'Read-only identity, Session list and selected Session detail.',
    order: 0
  },
  {
    id: 'agent-library',
    label: 'Agent Library',
    region: 'header',
    description: 'Read-only catalog, evidence and InstallPlan review entry point.',
    order: 1
  },
  {
    id: 'logs',
    label: 'Logs',
    region: 'operator',
    description: 'Read-only task output for the selected Agent.',
    order: 2
  },
  {
    id: 'control-status',
    label: 'Control status',
    region: 'dock',
    description: 'Read-only runtime, Connector and governance status evidence.',
    order: 3
  }
] as const;

export interface DockViewLayout {
  readonly version: typeof DOCK_VIEW_LAYOUT_VERSION;
  readonly activeView: DockViewId;
  readonly selectedAgentId: string | null;
  readonly selectedSessionKey: string | null;
}

export interface DockViewLayoutInput {
  readonly activeView?: DockViewId | null;
  readonly selectedAgentId?: string | null;
  readonly selectedSessionKey?: string | null;
}

export const DEFAULT_DOCK_VIEW_LAYOUT: DockViewLayout = Object.freeze({
  version: DOCK_VIEW_LAYOUT_VERSION,
  activeView: 'session-detail',
  selectedAgentId: null,
  selectedSessionKey: null
});

const DOCK_VIEW_IDS = new Set<DockViewId>(DOCK_VIEW_REGISTRY.map((view) => view.id));

export function isDockViewId(value: unknown): value is DockViewId {
  return typeof value === 'string' && DOCK_VIEW_IDS.has(value as DockViewId);
}

/**
 * Project selected identity and view state into a serializable D0 snapshot.
 * A missing Agent clears the Session key so host-process facts cannot create a
 * synthetic Session identity.
 */
export function projectDockViewLayout(input: DockViewLayoutInput = {}): DockViewLayout {
  const selectedAgentId = normalizeIdentity(input.selectedAgentId);
  return Object.freeze({
    version: DOCK_VIEW_LAYOUT_VERSION,
    activeView: isDockViewId(input.activeView) ? input.activeView : DEFAULT_DOCK_VIEW_LAYOUT.activeView,
    selectedAgentId,
    selectedSessionKey: selectedAgentId ? normalizeIdentity(input.selectedSessionKey) : null
  });
}

/** JSON representation for a future persistence adapter; does not persist itself. */
export function serializeDockViewLayout(layout: DockViewLayout): string {
  return JSON.stringify(projectDockViewLayout(layout));
}

/**
 * Restore a D0 layout from untrusted serialized data. Invalid data falls back
 * to a safe default and never invokes lifecycle or persistence APIs.
 */
export function restoreDockViewLayout(serialized: string | null | undefined): DockViewLayout {
  if (!serialized) {
    return projectDockViewLayout();
  }
  try {
    const value: unknown = JSON.parse(serialized);
    if (!isRecord(value) || value.version !== DOCK_VIEW_LAYOUT_VERSION) {
      return projectDockViewLayout();
    }
    return projectDockViewLayout({
      activeView: value.activeView as DockViewId | null,
      selectedAgentId: value.selectedAgentId as string | null,
      selectedSessionKey: value.selectedSessionKey as string | null
    });
  } catch {
    return projectDockViewLayout();
  }
}

export function getDockViewDefinition(viewId: DockViewId): DockViewDefinition {
  return DOCK_VIEW_REGISTRY.find((view) => view.id === viewId) ?? DOCK_VIEW_REGISTRY[0];
}

function normalizeIdentity(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
