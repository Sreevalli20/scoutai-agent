export type OpportunityType =
  | 'hackathon'
  | 'internship'
  | 'competition'
  | 'scholarship'
  | 'grant'
  | 'other';

export type ParticipationType = 'individual' | 'team' | 'either';

export type CostFilter = 'free' | 'paid' | 'either';

export type DeadlineFilter = 'any' | '7days' | '30days' | 'custom';

export interface UserProfile {
  country: string;
  skills: string[];
  experience: string; // 'student' | 'recent_grad' | 'entry' | 'mid' | 'researcher'
  educationStatus: string;
}

export interface ResearchPreferences {
  preferredTypes: OpportunityType[];
  preferredLocations: string[];
  maxCost: CostFilter;
  participation: ParticipationType;
}

export interface ResearchFilters {
  types: OpportunityType[];
  location: string;
  participation: ParticipationType;
  cost: CostFilter;
  deadline: DeadlineFilter;
  customDeadline?: string;
  skills: string[];
}

export interface ResearchRequest {
  query: string;
  profile: UserProfile;
  filters: ResearchFilters;
}

export interface ActionPlan {
  recommendation: string;
  checklist: string[];
  deadline?: string | null;
  required_materials?: string[];
}

export interface Opportunity {
  id: string;
  name: string;
  organization: string;
  url: string;
  deadline: string | null;
  location: string | null;
  participation: string | null;
  cost: string | null;
  prize: string | null;
  eligibility: string[];
  skills: string[];
  match_score: number; // 0 to 100
  reasoning: string;
  strong_matches?: string[];
  concerns: string[];
  description?: string;
  requirements?: string[];
  action_plan: ActionPlan;
}

export interface ResearchSummary {
  evaluated: number;
  matches: number;
  timestamp: string; // ISO-8601
}

export interface ResearchResponse {
  research_id: string;
  status: 'completed' | 'failed' | 'queued' | 'discovering' | 'reading' | 'reasoning' | 'ranking';
  summary: ResearchSummary;
  opportunities: Opportunity[];
  error?: string;
}

export type WorkflowStage = 'discover' | 'read' | 'reason' | 'rank' | 'act';

export type StageState = 'pending' | 'active' | 'completed' | 'failed';

export interface StageInfo {
  id: WorkflowStage;
  title: string;
  description: string;
  state: StageState;
  detail?: string;
}

export interface ResearchStatusResponse {
  research_id: string;
  status: 'queued' | 'discovering' | 'reading' | 'reasoning' | 'ranking' | 'completed' | 'failed';
  current_stage?: WorkflowStage;
  message?: string;
  details?: {
    pages_discovered?: number;
    pages_read?: number;
    opportunities_evaluated?: number;
  };
  result?: ResearchResponse;
  error?: string;
}

export interface HistoryItem {
  id: string;
  userId?: string;
  query: string;
  timestamp: string;
  resultCount: number;
  evaluatedCount?: number;
  filters: ResearchFilters;
  response?: ResearchResponse;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  profile: UserProfile;
  preferences?: ResearchPreferences;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
}

export interface SavedOpportunity {
  id: string;
  userId: string;
  opportunityId: string;
  opportunity: Opportunity;
  savedAt: string;
  tags: string[]; // e.g. 'Urgent', 'Long-term', 'Good Fit'
  notes?: string;
}

export interface BackendHealth {
  connected: boolean;
  checkedAt: string;
  endpoint: string;
  statusMessage: string;
  latencyMs?: number;
  version?: string;
}
