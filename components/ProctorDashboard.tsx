
import React from 'react';
import LiveFeed from './LiveFeed';
import IncidentList from './IncidentList';
import { Incident, SessionStats, ProctorConfig } from '../types';
// Add missing Activity icon to imports
import { User, BookOpen, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface ProctorDashboardProps {
  isActive: boolean;
  onIncident: (incident: Incident) => void;
  incidents: Incident[];
  stats: SessionStats;
  config: ProctorConfig;
}

const ProctorDashboard: React.FC<ProctorDashboardProps> = ({ 
  isActive, 
  onIncident, 
  incidents, 
  stats,
  config 
}) => {
  return (
    <>
      {/* Left Column - Live Feed & Profile */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Candidate Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
              <User className="text-slate-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{config.studentName}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <BookOpen className="w-3 h-3" />
                {config.examTitle}
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center px-4 py-1 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] uppercase text-slate-400 font-bold">Status</p>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {isActive ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Live
                  </span>
                ) : (
                  <span className="text-slate-400">Offline</span>
                )}
              </div>
            </div>
            <div className="text-center px-4 py-1 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] uppercase text-slate-400 font-bold">Risk Level</p>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {stats.integrityScore > 80 ? (
                  <span className="text-green-600">Low</span>
                ) : stats.integrityScore > 50 ? (
                  <span className="text-amber-600">Moderate</span>
                ) : (
                  <span className="text-red-600">High</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed Container */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-slate-700">Live Multi-modal Feed</span>
            </div>
            {isActive && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-red-500 animate-pulse flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  RECORDING
                </span>
                <span className="text-[10px] font-mono text-slate-400">FPS: 2.0</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-5 min-h-[400px]">
            <LiveFeed 
              isActive={isActive} 
              onIncidentDetected={(type, desc, severity) => {
                onIncident({
                  id: Math.random().toString(36).substr(2, 9),
                  timestamp: Date.now(),
                  type,
                  description: desc,
                  severity: severity as any
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Column - Incident Log & Alerts */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[800px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-slate-700">Incident Log</span>
            </div>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold">
              {incidents.length} TOTAL
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <IncidentList incidents={incidents} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">System Insights</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {incidents.length === 0 
                ? "No suspicious behavior detected. The candidate maintains high focus and compliance."
                : `Detected ${incidents.length} event(s). Review high-severity alerts to ensure integrity.`}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProctorDashboard;
