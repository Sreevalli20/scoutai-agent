from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class OpportunityType(str, Enum):
    hackathon = "hackathon"
    internship = "internship"
    competition = "competition"
    scholarship = "scholarship"
    grant = "grant"
    other = "other"


class ParticipationType(str, Enum):
    individual = "individual"
    team = "team"
    either = "either"


class CostFilter(str, Enum):
    free = "free"
    paid = "paid"
    either = "either"


class ResearchStatus(str, Enum):
    queued = "queued"
    discovering = "discovering"
    reading = "reading"
    reasoning = "reasoning"
    ranking = "ranking"
    completed = "completed"
    failed = "failed"


class StageState(str, Enum):
    pending = "pending"
    active = "active"
    completed = "completed"
    failed = "failed"


class UserProfile(BaseModel):
    country: str
    skills: List[str]
    experience: str
    education_status: str


class ResearchFilters(BaseModel):
    types: List[OpportunityType]
    location: str
    participation: ParticipationType
    cost: CostFilter
    deadline: str
    custom_deadline: Optional[str] = None
    skills: List[str]


class ResearchRequest(BaseModel):
    query: str
    profile: UserProfile
    filters: ResearchFilters


class ActionPlan(BaseModel):
    recommendation: str
    checklist: List[str]
    deadline: Optional[str] = None
    required_materials: Optional[List[str]] = None


class Opportunity(BaseModel):
    id: str
    name: str
    organization: str
    url: str
    deadline: Optional[str] = None
    location: Optional[str] = None
    participation: Optional[str] = None
    cost: Optional[str] = None
    prize: Optional[str] = None
    eligibility: List[str] = []
    skills: List[str] = []
    match_score: int = Field(ge=0, le=100)
    reasoning: str
    strong_matches: Optional[List[str]] = None
    concerns: List[str] = []
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    action_plan: ActionPlan


class ResearchSummary(BaseModel):
    evaluated: int
    matches: int
    timestamp: datetime


class Progress(BaseModel):
    discover: StageState = StageState.pending
    read: StageState = StageState.pending
    reason: StageState = StageState.pending
    rank: StageState = StageState.pending
    act: StageState = StageState.pending


class ResearchStatusResponse(BaseModel):
    research_id: str
    status: ResearchStatus
    progress: Progress
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ResearchResponse(BaseModel):
    research_id: str
    status: ResearchStatus


class HealthResponse(BaseModel):
    status: str
    service: str


class WebContent(BaseModel):
    """Normalized web content from Anakin scraping."""
    title: Optional[str] = None
    organization: Optional[str] = None
    source_url: str
    deadline: Optional[str] = None
    location: Optional[str] = None
    participation: Optional[str] = None
    cost: Optional[str] = None
    prize: Optional[str] = None
    eligibility: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    relevant_skills: Optional[List[str]] = None
    description: Optional[str] = None
    raw_content: Optional[str] = None


class GroqEvaluation(BaseModel):
    """Structured evaluation from Groq reasoning."""
    relevance: int = Field(ge=0, le=100)
    eligibility: int = Field(ge=0, le=100)
    skill_alignment: int = Field(ge=0, le=100)
    location_compatibility: int = Field(ge=0, le=100)
    participation_compatibility: int = Field(ge=0, le=100)
    cost_compatibility: int = Field(ge=0, le=100)
    deadline_viability: int = Field(ge=0, le=100)
    match_score: int = Field(ge=0, le=100)
    reasoning: str
    concerns: List[str] = []
    strong_matches: List[str] = []
    recommendation: str
    checklist: List[str] = []
