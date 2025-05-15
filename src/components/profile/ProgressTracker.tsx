
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
}

interface ProgressTrackerProps {
  sessions?: Session[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ sessions = [] }) => {
  // Calculate progress metrics based on sessions
  const calculateEngagementScore = () => {
    if (sessions.length === 0) return 0;
    
    // Simple score based on number of sessions
    // Max out at 10 sessions for 100% engagement
    return Math.min(sessions.length * 10, 100);
  };
  
  const calculateConsistencyScore = () => {
    if (sessions.length < 2) return 0;
    
    // Check frequency of sessions
    const dates = sessions.map(s => new Date(s.date).getTime());
    dates.sort((a, b) => a - b);
    
    // Calculate average days between sessions
    let totalGaps = 0;
    for (let i = 1; i < dates.length; i++) {
      const gap = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24); // gap in days
      totalGaps += gap;
    }
    
    const avgGap = totalGaps / (dates.length - 1);
    
    // Score based on average gap (lower gap = higher score)
    // 1 day gap = 100%, 7+ day gap = 0%
    return Math.max(0, 100 - ((avgGap - 1) * 16.67));
  };
  
  const calculateVarietyScore = () => {
    if (sessions.length === 0) return 0;
    
    // Count unique types of interactions
    const types = new Set(sessions.map(s => s.type));
    
    // 3+ types = 100%, 2 types = 67%, 1 type = 33%
    return Math.min(types.size, 3) * 33.33;
  };

  const engagementScore = calculateEngagementScore();
  const consistencyScore = calculateConsistencyScore();
  const varietyScore = calculateVarietyScore();

  return (
    <Card className="border-teal-200 dark:border-teal-900 bg-gradient-to-br from-white to-teal-50 dark:from-gray-900 dark:to-teal-950">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm text-teal-700 dark:text-teal-300">Engagement</h3>
              <span className="text-sm font-medium text-teal-700 dark:text-teal-300">{Math.round(engagementScore)}%</span>
            </div>
            <Progress value={engagementScore} className={cn("h-2 bg-teal-100 dark:bg-teal-900/30")} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sessions.length === 0 
                ? "Start your first session to build engagement"
                : sessions.length === 1
                ? "Great start with your first session!"
                : `You've completed ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm text-teal-700 dark:text-teal-300">Consistency</h3>
              <span className="text-sm font-medium text-teal-700 dark:text-teal-300">{Math.round(consistencyScore)}%</span>
            </div>
            <Progress value={consistencyScore} className={cn("h-2 bg-teal-100 dark:bg-teal-900/30")} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sessions.length < 2
                ? "Complete more sessions to measure consistency"
                : consistencyScore > 80
                ? "Excellent consistency in your practice"
                : consistencyScore > 50
                ? "Good rhythm of sessions"
                : "Try to maintain regular sessions"
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm text-teal-700 dark:text-teal-300">Variety</h3>
              <span className="text-sm font-medium text-teal-700 dark:text-teal-300">{Math.round(varietyScore)}%</span>
            </div>
            <Progress value={varietyScore} className={cn("h-2 bg-teal-100 dark:bg-teal-900/30")} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sessions.length === 0
                ? "Explore different session types"
                : varietyScore > 66
                ? "Great mix of different session types"
                : varietyScore > 33
                ? "You've tried multiple session formats"
                : "Try different session types for a richer experience"
              }
            </p>
          </div>
          
          <div className="p-4 bg-white/75 dark:bg-gray-800/50 rounded-lg border border-teal-100 dark:border-teal-900/30">
            <h4 className="font-medium text-sm mb-2 text-teal-700 dark:text-teal-300">Journey Status</h4>
            <div className="flex items-center justify-between">
              <p className="text-sm">
                {sessions.length === 0
                  ? "Not Started"
                  : sessions.length < 3
                  ? "Just Beginning"
                  : sessions.length < 7
                  ? "Building Momentum"
                  : "Regular Practice"}
              </p>
              <div className="bg-teal-100 dark:bg-teal-900/30 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                  {sessions.length === 0
                    ? "Explore"
                    : sessions.length < 3
                    ? "Novice"
                    : sessions.length < 7
                    ? "Growing"
                    : "Advanced"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
