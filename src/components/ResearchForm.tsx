import React, { useState, KeyboardEvent } from 'react';
import {
  Globe,
  Search,
  Sparkles,
  X,
  Plus,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CostFilter,
  DeadlineFilter,
  OpportunityType,
  ParticipationType,
  ResearchFilters,
} from '../types';

interface ResearchFormProps {
  query: string;
  onQueryChange: (val: string) => void;
  filters: ResearchFilters;
  onFiltersChange: (filters: ResearchFilters) => void;
  onSubmit: () => void;
  isSearching: boolean;
}

const OPPORTUNITY_TYPES: { id: OpportunityType; label: string }[] = [
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'internship', label: 'Internships' },
  { id: 'competition', label: 'Competitions' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'grant', label: 'Grants' },
  { id: 'other', label: 'Other' },
];

const LOCATIONS = ['Anywhere', 'India', 'Remote', 'Custom'];
const PARTICIPATION_OPTIONS: { id: ParticipationType; label: string }[] = [
  { id: 'individual', label: 'Individual' },
  { id: 'team', label: 'Team' },
  { id: 'either', label: 'Either' },
];
const COST_OPTIONS: { id: CostFilter; label: string }[] = [
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
  { id: 'either', label: 'Either' },
];
const DEADLINE_OPTIONS: { id: DeadlineFilter; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: '7days', label: '7 days' },
  { id: '30days', label: '30 days' },
  { id: 'custom', label: 'Custom' },
];

const SKILL_SUGGESTIONS = ['Python', 'AI', 'Machine Learning', 'Web Development', 'React', 'Data Science'];

export const ResearchForm: React.FC<ResearchFormProps> = ({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onSubmit,
  isSearching,
}) => {
  const [skillInput, setSkillInput] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);

  const toggleOpportunityType = (type: OpportunityType) => {
    const exists = filters.types.includes(type);
    const updated = exists
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({
      ...filters,
      types: updated.length > 0 ? updated : ['hackathon'], // keep at least one
    });
  };

  const handleLocationSelect = (loc: string) => {
    if (loc === 'Custom') {
      onFiltersChange({
        ...filters,
        location: customLocation.trim() || 'Custom',
      });
    } else {
      onFiltersChange({
        ...filters,
        location: loc,
      });
    }
  };

  const handleAddSkill = (skillToAdd?: string) => {
    const target = (skillToAdd || skillInput).trim();
    if (!target) return;
    if (!filters.skills.includes(target)) {
      onFiltersChange({
        ...filters,
        skills: [...filters.skills, target],
      });
    }
    setSkillInput('');
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skill: string) => {
    onFiltersChange({
      ...filters,
      skills: filters.skills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    onSubmit();
  };

  return (
    <div
      id="research-form-card"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 transition-all"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title & Description */}
        <div>
          <label
            htmlFor="research-query-input"
            className="block text-base font-semibold text-slate-900 tracking-tight"
          >
            What are you looking for?
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Describe your target opportunities. ScoutAI will research the live web to find and analyze matches.
          </p>
        </div>

        {/* Large Multiline Input */}
        <div className="relative">
          <textarea
            id="research-query-input"
            rows={3}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            disabled={isSearching}
            placeholder="Find free AI hackathons that allow individual participation and are open to students in India."
            className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-y min-h-[90px] leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Structured Filters */}
        <div className="space-y-4 pt-1">
          {/* Opportunity Types Multi-Select */}
          <div>
            <span className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-2">
              Opportunity Type
            </span>
            <div
              id="filter-opportunity-types"
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Opportunity types"
            >
              {OPPORTUNITY_TYPES.map((type) => {
                const isSelected = filters.types.includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    id={`type-filter-${type.id}`}
                    onClick={() => toggleOpportunityType(type.id)}
                    disabled={isSearching}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/70'
                    } disabled:opacity-50`}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1.5" />}
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid for Location, Participation, Cost, Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Select */}
            <div id="filter-location-group">
              <label
                htmlFor="filter-location-select"
                className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Location
              </label>
              <select
                id="filter-location-select"
                value={LOCATIONS.includes(filters.location) ? filters.location : 'Custom'}
                onChange={(e) => handleLocationSelect(e.target.value)}
                disabled={isSearching}
                className="w-full text-xs font-medium bg-white text-slate-800 border border-slate-300 rounded-md px-2.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {(!LOCATIONS.slice(0, 3).includes(filters.location) || filters.location === 'Custom') && (
                <input
                  type="text"
                  id="filter-custom-location"
                  placeholder="Enter country or region"
                  value={customLocation || (filters.location !== 'Custom' ? filters.location : '')}
                  onChange={(e) => {
                    setCustomLocation(e.target.value);
                    onFiltersChange({ ...filters, location: e.target.value || 'Custom' });
                  }}
                  disabled={isSearching}
                  className="mt-1.5 w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              )}
            </div>

            {/* Participation Options */}
            <div id="filter-participation-group">
              <span className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Participation
              </span>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                {PARTICIPATION_OPTIONS.map((opt) => {
                  const isSelected = filters.participation === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`participation-filter-${opt.id}`}
                      onClick={() => onFiltersChange({ ...filters, participation: opt.id })}
                      disabled={isSearching}
                      className={`text-xs py-1.5 px-2 rounded font-medium text-center transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cost Options */}
            <div id="filter-cost-group">
              <span className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Cost
              </span>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                {COST_OPTIONS.map((opt) => {
                  const isSelected = filters.cost === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`cost-filter-${opt.id}`}
                      onClick={() => onFiltersChange({ ...filters, cost: opt.id })}
                      disabled={isSearching}
                      className={`text-xs py-1.5 px-2 rounded font-medium text-center transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deadline Options */}
            <div id="filter-deadline-group">
              <span className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">
                Deadline
              </span>
              <div className="grid grid-cols-4 gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                {DEADLINE_OPTIONS.map((opt) => {
                  const isSelected = filters.deadline === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`deadline-filter-${opt.id}`}
                      onClick={() => onFiltersChange({ ...filters, deadline: opt.id })}
                      disabled={isSearching}
                      className={`text-[11px] py-1.5 px-1 rounded font-medium text-center truncate transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Skills Tag Input */}
          <div id="filter-skills-group" className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="skill-tag-input"
                className="block text-xs font-medium text-slate-700 uppercase tracking-wider"
              >
                Skills & Technologies
              </label>
              <span className="text-[11px] text-slate-400">Press Enter or comma to add</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-300 rounded-md focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent">
              {filters.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2.5 py-1 rounded bg-white text-xs font-medium text-slate-800 border border-slate-200 shadow-2xs"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    disabled={isSearching}
                    className="ml-1 text-slate-400 hover:text-slate-700 focus:outline-hidden"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                id="skill-tag-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                disabled={isSearching}
                placeholder={filters.skills.length === 0 ? 'e.g. Python, AI, React...' : 'Add another skill...'}
                className="flex-1 min-w-[140px] text-xs bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:outline-hidden py-1 px-1"
              />
            </div>

            {/* Quick Skill Suggestions */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Quick add:</span>
              {SKILL_SUGGESTIONS.map((suggestion) => {
                const alreadyAdded = filters.skills.includes(suggestion);
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddSkill(suggestion)}
                    disabled={alreadyAdded || isSearching}
                    className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      alreadyAdded
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {!alreadyAdded && <Plus className="w-2.5 h-2.5 mr-1 text-slate-400" />}
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Agent will crawl live web sources and reason on real-time opportunities.</span>
          </div>

          <button
            type="submit"
            id="research-submit-btn"
            disabled={!query.trim() || isSearching}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            {isSearching ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                Researching Live Web...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2 text-emerald-400" />
                Research Opportunities
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
