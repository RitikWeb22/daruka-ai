import React from 'react';
import type { EnvironmentalState } from '../../types/environmental';
import { Activity, Droplet, Sun, Sprout, ShieldAlert, AlertCircle } from 'lucide-react';

interface Props {
  state: EnvironmentalState;
  completeness: {
    score: number;
    available_variables: string[];
    missing_critical_variables: string[];
    is_sufficient: boolean;
  };
}

export const StateViewer: React.FC<Props> = ({ state, completeness }) => {
  const percent = Math.round(completeness.score * 100);

  return (
    <div className="state-viewer-card">
      <div className="state-header">
        <div className="flex-between">
          <div className="state-title-row">
            <Activity className="icon-emerald" size={20} />
            <h3 className="section-heading">Environmental State Model</h3>
          </div>
          <span className={`badge ${completeness.is_sufficient ? 'badge-success' : 'badge-warning'}`}>
            {completeness.is_sufficient ? 'Sufficient for Diagnosis' : 'Data Incomplete'}
          </span>
        </div>

        {/* Completeness Bar */}
        <div className="completeness-container">
          <div className="flex-between text-xs mb-1">
            <span className="text-secondary">Information Completeness</span>
            <span className="font-semibold text-emerald">{percent}%</span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${percent >= 50 ? 'bg-emerald' : 'bg-amber'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of 5 Environmental Domains */}
      <div className="state-domains-grid">
        
        {/* Domain 1: Soil Health */}
        <div className="domain-card">
          <div className="domain-header">
            <Droplet size={16} className="text-amber" />
            <span className="domain-name">Soil Health</span>
          </div>
          <div className="domain-content">
            <div className="data-row">
              <span className="data-label">Organic Carbon (SOC):</span>
              <span className={`data-value ${state.soil.organic_carbon_percent !== undefined ? 'highlight-val' : 'empty-val'}`}>
                {state.soil.organic_carbon_percent !== undefined ? `${state.soil.organic_carbon_percent}%` : 'Unspecified'}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Moisture:</span>
              <span className={`data-value ${state.soil.moisture_percent !== undefined ? 'highlight-val' : 'empty-val'}`}>
                {state.soil.moisture_percent !== undefined ? `${state.soil.moisture_percent}%` : 'Unspecified'}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Soil pH:</span>
              <span className={`data-value ${state.soil.ph !== undefined ? 'highlight-val' : 'empty-val'}`}>
                {state.soil.ph !== undefined ? state.soil.ph : 'Unspecified'}
              </span>
            </div>
          </div>
        </div>

        {/* Domain 2: Climate */}
        <div className="domain-card">
          <div className="domain-header">
            <Sun size={16} className="text-orange" />
            <span className="domain-name">Climate & Hydrology</span>
          </div>
          <div className="domain-content">
            <div className="data-row">
              <span className="data-label">Bioclimatic Region:</span>
              <span className={`data-value capitalize ${state.region || state.climate.region ? 'highlight-val' : 'empty-val'}`}>
                {state.region || state.climate.region || 'Unspecified'}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Rainfall Regime:</span>
              <span className={`data-value capitalize ${state.climate.rainfall !== undefined ? 'highlight-val' : 'empty-val'}`}>
                {state.climate.rainfall !== undefined ? (typeof state.climate.rainfall === 'number' ? `${state.climate.rainfall} mm` : state.climate.rainfall) : 'Unspecified'}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Drought Stress:</span>
              <span className="data-value">
                {state.climate.drought_conditions ? String(state.climate.drought_conditions) : 'Normal / Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Domain 3: Land Use & Cover */}
        <div className="domain-card">
          <div className="domain-header">
            <Sprout size={16} className="text-emerald" />
            <span className="domain-name">Land Use & Cropping</span>
          </div>
          <div className="domain-content">
            <div className="data-row">
              <span className="data-label">Primary Crop:</span>
              <span className={`data-value capitalize ${state.land_use.crop ? 'highlight-val' : 'empty-val'}`}>
                {state.land_use.crop || 'Unspecified'}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Cropping System:</span>
              <span className={`data-value capitalize ${state.land_use.cropping_system ? 'highlight-val' : 'empty-val'}`}>
                {state.land_use.cropping_system ? state.land_use.cropping_system.replace(/_/g, ' ') : 'Unspecified'}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Land Cover Type:</span>
              <span className="data-value capitalize">
                {state.land_use.type || 'Cropland'}
              </span>
            </div>
          </div>
        </div>

        {/* Domain 4: Human Impact */}
        <div className="domain-card">
          <div className="domain-header">
            <ShieldAlert size={16} className="text-rose" />
            <span className="domain-name">Human Impact</span>
          </div>
          <div className="domain-content">
            <div className="data-row">
              <span className="data-label">Pesticide Intensity:</span>
              <span className={`data-value capitalize ${state.human_impact.pesticide_intensity ? 'highlight-val' : 'empty-val'}`}>
                {state.human_impact.pesticide_intensity || 'Not specified'}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Pollution Load:</span>
              <span className="data-value capitalize">
                {state.human_impact.pollution || 'Low/None reported'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Missing Variables Warning Section */}
      {completeness.missing_critical_variables.length > 0 && (
        <div className="missing-vars-banner">
          <div className="missing-vars-title">
            <AlertCircle size={14} className="text-amber" />
            <span>Missing Variables for Exact Diagnosis:</span>
          </div>
          <div className="missing-tags">
            {completeness.missing_critical_variables.map(v => (
              <span key={v} className="tag-missing">
                {v.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
