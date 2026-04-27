
import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Settings, Activity, History, AlertCircle, Play, Square, User } from 'lucide-react';
import ProctorDashboard from './components/ProctorDashboard';
import { Incident, SessionStats, ProctorConfig, IncidentSeverity } from './types';

const App: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [config, setConfig] = useState<ProctorConfig>({
    studentName: 'Candidate-7721',
    examTitle: 'Advanced Neural Networks Midterm',
    sensitivity: 75
  });

  const [stats, setStats] = useState<SessionStats>({
    duration: 0,
    incidentCount: 0,
    integrityScore: 100,
    status: 'idle'
  });

  const handleIncident = useCallback((incident: Incident) => {
    setIncidents(prev => [incident, ...prev]);
    setStats(prev => {
      const deduction = incident.severity === IncidentSeverity.CRITICAL ? 25 : 
                        incident.severity === IncidentSeverity.HIGH ? 10 : 5;
      return {
        ...prev,
        incidentCount: prev.incidentCount + 1,
        integrityScore: Math.max(0, prev.integrityScore - deduction)
      };
    });
  }, []);

  const startSession = () => {
    setIsSessionActive(true);
    setIncidents([]);
    setStats(prev => ({ ...prev, status: 'active', duration: 0, incidentCount: 0, integrityScore: 100 }));
  };

  const endSession = () => {
    setIsSessionActive(false);
    setStats(prev => ({ ...prev, status: 'ended' }));
  };

  // Visibility monitoring to detect window/tab switching
  useEffect(() => {
    if (!isSessionActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleIncident({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          type: 'WINDOW_SWITCH_DETECTED',
          description: 'The candidate switched to another tab or window, navigating away from the exam interface.',
          severity: IncidentSeverity.CRITICAL
        });
      }
    };

    const handleBlur = () => {
      handleIncident({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type: 'FOCUS_LOST',
        description: 'The exam window lost focus, indicating potential use of background applications.',
        severity: IncidentSeverity.HIGH
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isSessionActive, handleIncident]);

  useEffect(() => {
    let interval: number;
    if (isSessionActive) {
      interval = window.setInterval(() => {
        setStats(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">VigilantAI</h1>
            <p className="text-xs text-slate-500 font-medium">Exam Integrity Monitor</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400">Integrity Score</span>
              <span className={`font-bold ${stats.integrityScore > 80 ? 'text-green-600' : stats.integrityScore > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {stats.integrityScore}%
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
              <span className="font-mono font-bold text-indigo-600">
                {Math.floor(stats.duration / 60).toString().padStart(2, '0')}:
                {(stats.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {!isSessionActive ? (
              <button
                onClick={startSession}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Proctoring
              </button>
            ) : (
              <button
                onClick={endSession}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm"
              >
                <Square className="w-4 h-4 fill-current" />
                End Session
              </button>
            )}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ProctorDashboard 
          isActive={isSessionActive} 
          onIncident={handleIncident}
          incidents={incidents}
          stats={stats}
          config={config}
        />
      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            System Status: {isSessionActive ? 'PROCTORING ACTIVE' : 'STANDBY'}
          </span>
          <span>•</span>
          <span>Gemini-2.5-Flash Multi-modal Engine</span>
        </div>
        <div className="flex gap-4">
          <span>SECURE_DATA_ENCRYPTION: AES-256</span>
          <span>SENSITIVITY: {config.sensitivity}%</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
