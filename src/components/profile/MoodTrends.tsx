
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
}

interface MoodTrendsProps {
  sessions: Session[];
}

const moodToValue = (mood: string): number => {
  const moodMap: Record<string, number> = {
    "happy": 5,
    "joyful": 5,
    "excited": 4.5,
    "optimistic": 4,
    "content": 4,
    "calm": 3.5,
    "neutral": 3,
    "reflective": 3,
    "tired": 2.5,
    "anxious": 2,
    "sad": 1.5,
    "stressed": 1,
    "angry": 0.5,
    "depressed": 0
  };
  
  return moodMap[mood.toLowerCase()] || 3; // Default to neutral if mood not found
};

const MoodTrends = ({ sessions = [] }: MoodTrendsProps) => {
  // Process session data into mood trend data
  const generateMoodData = () => {
    if (sessions.length === 0) {
      // Return sample data if no sessions
      return Array(7).fill(null).map((_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: null
      }));
    }
    
    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Map to mood values
    return sortedSessions.map(session => ({
      date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: moodToValue(session.mood),
      mood: session.mood
    }));
  };
  
  const moodData = generateMoodData();
  const hasData = sessions.length > 0;

  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 overflow-hidden shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium">Emotional Journey</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {hasData ? `Last ${moodData.length} sessions` : "No mood data yet"}
              </span>
            </div>
          </div>
          
          <div className={`h-[300px] bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 shadow-inner ${!hasData ? "flex items-center justify-center" : ""}`}>
            {!hasData ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Complete a session to track your mood.</p>
            ) : (
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodData} margin={{ top: 20, right: 5, left: 0, bottom: 5 }}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#9061f9"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#9061f9", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 6, fill: "#9061f9", strokeWidth: 0 }}
                    />
                    <XAxis 
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#888" }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#888" }}
                      width={30}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      tickFormatter={(value) => {
                        const moodScale = ["Low", "", "", "Neutral", "", "High"];
                        return moodScale[value] || "";
                      }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow border border-gray-200 dark:border-gray-700">
                              <p className="text-sm">{data.date}</p>
                              <p className="text-sm font-medium capitalize">{data.mood}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white/90 dark:bg-gray-800/50 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30 text-center">
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-1">Most Common Mood</p>
              <p className="text-lg font-medium capitalize">
                {hasData ? 
                  (Object.entries(sessions.reduce((acc, session) => {
                    acc[session.mood] = (acc[session.mood] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>))
                  .sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral") 
                  : "N/A"}
              </p>
            </div>
            
            <div className="bg-white/90 dark:bg-gray-800/50 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30 text-center">
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-1">Average Mood</p>
              <p className="text-lg font-medium">
                {hasData ? 
                  (() => {
                    const avg = sessions.reduce((sum, session) => sum + moodToValue(session.mood), 0) / sessions.length;
                    if (avg >= 4) return "Positive";
                    if (avg >= 3) return "Balanced";
                    if (avg >= 2) return "Mixed";
                    return "Challenging";
                  })() 
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodTrends;
