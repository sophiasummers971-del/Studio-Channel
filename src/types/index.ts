export type PlatformId = 'instagram' | 'facebook' | 'tiktok' | 'pinterest' | 'linkedin';

export type ContentFormatId =
  | 'reels'
  | 'stories'
  | 'posts'
  | 'pins'
  | 'short-form';

export type ContentStage =
  | 'ideation'
  | 'drafting'
  | 'review'
  | 'scheduled'
  | 'published';

export type ContentStatus = 'active' | 'archived';

export interface ContentFormat {
  id: ContentFormatId;
  label: string;
  description: string;
  icon: string;
}

export interface Platform {
  id: PlatformId;
  label: string;
  icon: string;
  color: string;
  accent: string;
  formats: ContentFormatId[];
  description: string;
}

export interface ContentInput {
  topic: string;
  audience: string;
  tone: string;
  keywords: string[];
  references: string[];
  callToAction: string;
  brandGuidelines: string;
}

export interface ContentOutput {
  caption: string;
  hashtags: string[];
  script: string;
  visualDirection: string;
  thumbnailConcept: string;
  postingTime: string;
  estimatedReach: string;
  // Pinterest-specific
  pinTitle?: string;
  pinDescription?: string;
  boardName?: string;
  altText?: string;
  mediaUrl?: string;
}

export interface MediaAsset {
  id: string;
  contentId: string | null;
  platform: PlatformId | null;
  contentType: string;
  fileName: string;
  fileSize: number | null;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  label: string | null;
  status: 'active' | 'removed';
}

export interface ContentItem {
  id: string;
  platform: PlatformId;
  format: ContentFormatId;
  title: string;
  stage: ContentStage;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  input: Partial<ContentInput>;
  output: Partial<ContentOutput>;
  assignee: string;
  mediaAssetId?: string | null;
}

// ── Universal Workflow Types ──

export type WorkflowStageId =
  | 'trigger'
  | 'topic-selection'
  | 'brief-creation'
  | 'draft-generation'
  | 'asset-production'
  | 'caption-variants'
  | 'approval-checkpoint'
  | 'scheduling'
  | 'handoff';

export interface WorkflowStage {
  id: WorkflowStageId;
  label: string;
  description: string;
  icon: string;
  cadence: 'daily' | 'weekly';
  isUniversal: boolean;
  extensionPoint?: string;
}

export type RunStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'revisions';

export interface WorkflowRun {
  id: string;
  date: string;
  stage: WorkflowStageId;
  status: RunStatus;
  itemsProcessed: number;
  itemsGenerated: number;
  duration: string;
}

export interface ApprovalBatch {
  id: string;
  weekLabel: string;
  items: ApprovalItem[];
  reviewDate: string;
  status: 'open' | 'closed';
}

export interface ApprovalItem {
  contentId: string;
  title: string;
  platform: PlatformId;
  format: ContentFormatId;
  decision: ApprovalDecision;
  reviewer: string;
  notes: string;
}

export interface ExtensionPoint {
  id: string;
  label: string;
  description: string;
  universal: boolean;
  channelOverrides: { platform: PlatformId; behavior: string }[];
}

export type ViewId =
  | 'dashboard'
  | 'connections'
  | 'platform'
  | 'pipeline'
  | 'content'
  | 'inputs'
  | 'outputs'
  | 'workflow'
  | 'approval'
  | 'extensions'
  | 'test-plan'
  | 'deployment-gate'
  | 'channel-rollout'
  | 'fallback-path'
  | 'instagram-pilot'
  | 'tiktok-setup'
  | 'pinterest-setup'
  | 'linkedin-setup'
  | 'content-generator'
  | 'publish-handoff';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  view: ViewId;
}

// ── Test Plan Types ──

export type TestStatus = 'not-run' | 'running' | 'passed' | 'failed' | 'warning';
export type TestCategory =
  | 'trigger'
  | 'continuity'
  | 'output'
  | 'repeatability'
  | 'approval'
  | 'fallback'
  | 'adaptation';

export interface TestScenario {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  steps: string[];
  passCriteria: string[];
  failCriteria: string[];
  relatedStages: WorkflowStageId[];
  weight: 'critical' | 'important' | 'standard';
}

export interface TestResult {
  scenarioId: string;
  status: TestStatus;
  duration: string;
  notes: string;
  checksPassed: number;
  checksTotal: number;
  timestamp: string | null;
}

export interface TestIssue {
  id: string;
  scenarioId: string;
  severity: 'blocker' | 'major' | 'minor';
  description: string;
  affectedStage: WorkflowStageId;
  status: 'open' | 'fixing' | 'resolved';
  mustFixBeforeDeploy: boolean;
}

export interface DeploymentChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'core-tests' | 'quality' | 'process' | 'readiness';
  required: boolean;
  checked: boolean;
}

export type ReadinessDecision = 'pending' | 'ready' | 'rework';

// ── Fallback Path Types ──

export type FailureCaseId =
  | 'stage-failure'
  | 'output-unusable'
  | 'approval-blocked'
  | 'extension-break'
  | 'manual-overload';

export type FallbackMode = 'normal' | 'fallback' | 'recovering';

export interface FailureCase {
  id: FailureCaseId;
  label: string;
  description: string;
  trigger: string;
  affectedStages: WorkflowStageId[];
  severity: 'critical' | 'high' | 'medium';
  autoDetect: boolean;
}

export interface FallbackStep {
  id: string;
  label: string;
  description: string;
  order: number;
  isMvp: boolean;
}

export interface MinViableOutput {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export interface RecoveryCheck {
  id: string;
  label: string;
  description: string;
  required: boolean;
  checked: boolean;
}

export interface FallbackPreDeployCheck {
  id: string;
  label: string;
  description: string;
  required: boolean;
  checked: boolean;
}

// ── Channel Rollout Types ──

export type RolloutPhaseId = 'baseline-validated' | 'baseline-deployed' | 'pilot' | 'expand-1' | 'expand-2' | 'expand-3' | 'complete';

export type ChannelRolloutStatus = 'locked' | 'ready' | 'in-progress' | 'passed' | 'blocked';

export interface RolloutEntryCriterion {
  id: string;
  label: string;
  description: string;
  met: boolean;
}

export interface ChannelCheckpoint {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}

export interface ChannelRolloutStep {
  id: string;
  platformId: PlatformId;
  phase: RolloutPhaseId;
  order: number;
  label: string;
  status: ChannelRolloutStatus;
  entryCriteria: RolloutEntryCriterion[];
  checkpoints: ChannelCheckpoint[];
  dependencies: string[];
  notes: string;
}

export interface RolloutDependency {
  id: string;
  from: string;
  to: string;
  label: string;
  type: 'blocking' | 'conditional' | 'optional';
}

// ── Instagram Pilot Types ──

export interface PrerequisiteCheck {
  id: string;
  label: string;
  description: string;
  met: boolean;
}

export interface BaselineElement {
  id: string;
  stageId: WorkflowStageId;
  label: string;
  description: string;
  reusedAsIs: boolean;
}

export interface InstagramAdjustment {
  id: string;
  stageId: WorkflowStageId;
  label: string;
  universalBehavior: string;
  instagramBehavior: string;
  rationale: string;
  enabled: boolean;
}

export interface PilotCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}

export interface ReusableLesson {
  id: string;
  lesson: string;
  appliesTo: PlatformId[];
  isInstagramSpecific: boolean;
}

// ── Publish Pipeline Types ──

export type PublishStatus = 'pending' | 'publishing' | 'published' | 'failed';

export interface PublishJob {
  id: string;
  contentId: string;
  platform: PlatformId;
  status: PublishStatus;
  scheduledFor: string | null;
  publishedAt: string | null;
  externalId: string | null;
  externalUrl: string | null;
  errorMessage: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Content item enriched with publish state
export interface ScheduledContent extends ContentItem {
  publishJob?: PublishJob;
}
