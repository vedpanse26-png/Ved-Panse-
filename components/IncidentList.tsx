
import React from 'react';
import { Incident, IncidentSeverity } from '../types';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
}

const IncidentList: React.FC<IncidentListProps> = ({ incidents }) => {
  if (incidents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p className="text-sm font-medium text-slate-500">No behavioral anomalies <br/> detected yet.</p>
      </div>
    );
  }

  const getSeverityStyles = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.CRITICAL:
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-600 text-white'
        };
      case IncidentSeverity.HIGH:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          badge: 'bg-orange-600 text-white'
        };
      case IncidentSeverity.MEDIUM:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-500 text-white'
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-500 text-white'
        };
    }
  };

  return (
    <div className="space-y-4">
      {incidents.map((incident) => {
        const styles = getSeverityStyles(incident.severity);
        return (
          <div 
            key={incident.id} 
            className={`${styles.bg} ${styles.border} border rounded-xl p-4 transition-all hover:shadow-sm`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {styles.icon}
                <span className="font-bold text-sm text-slate-800">{incident.type.replace(/_/g, ' ')}</span>
              </div>
              <span className={`${styles.badge} text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                {incident.severity}
              </span>
            </div>
            
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              {incident.description}
            </p>
            
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Clock className="w-3 h-3" />
              {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IncidentList;
