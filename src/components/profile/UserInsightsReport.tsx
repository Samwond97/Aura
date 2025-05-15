
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Trophy, HeartHandshake, AlertTriangle, TrendingUp } from "lucide-react";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
  conversation?: {role: string, content: string}[];
}

interface UserInsight {
  category: string;
  items: {
    title: string;
    description: string;
    confidence?: number;
  }[];
  icon: React.ElementType;
}

interface UserInsightsReportProps {
  sessions: Session[];
}

const UserInsightsReport = ({ sessions = [] }: UserInsightsReportProps) => {
  const [insightsData, setInsightsData] = useState<UserInsight[]>([]);

  useEffect(() => {
    // Generate insights based on session data
    if (sessions.length > 0) {
      generateInsightsFromSessions(sessions);
    } else {
      // Fallback to empty state if no sessions
      setInsightsData([]);
    }
  }, [sessions]);

  const generateInsightsFromSessions = (sessionData: Session[]) => {
    // This function analyzes session data to generate insights
    // For now, we'll create some insights based on session count and types
    
    // Count session types
    const textSessions = sessionData.filter(s => s.type === 'text').length;
    const voiceSessions = sessionData.filter(s => s.type === 'voice').length;
    const guidedSessions = sessionData.filter(s => s.type === 'guided').length;
    
    // Get mood data
    const moodSet = new Set(sessionData.map(s => s.mood));
    const moodVariety = moodSet.size;
    
    // Analyze content if available (simplified)
    const allContent = sessionData
      .flatMap(s => s.conversation || [])
      .filter(m => m.role === 'user')
      .map(m => m.content);
    
    // Generate mock insights based on real session data
    const generatedInsights: UserInsight[] = [
      {
        category: "Personality Type",
        icon: Brain,
        items: [
          {
            title: textSessions > voiceSessions ? "Thoughtful Writer" : "Verbal Communicator",
            description: textSessions > voiceSessions 
              ? "You prefer expressing thoughts through writing, taking time to formulate responses."
              : "You favor speaking your thoughts directly, embracing spontaneous communication.",
            confidence: 70 + Math.min(sessionData.length * 2, 25)
          },
          {
            title: sessionData.length > 5 ? "Consistent Engager" : "Exploratory Learner",
            description: sessionData.length > 5
              ? "You maintain regular interaction patterns, showing commitment to your growth journey."
              : "You're in the early stages of exploring how conversations can support your development.",
            confidence: 75 + Math.min(sessionData.length, 20)
          }
        ]
      },
      {
        category: "Strengths",
        icon: Trophy,
        items: [
          {
            title: moodVariety > 2 ? "Emotional Awareness" : "Emotional Stability",
            description: moodVariety > 2
              ? "You recognize and express a range of emotional states in your sessions."
              : "You maintain consistent emotional states across your interactions.",
            confidence: 80 + Math.min(moodVariety * 3, 15)
          },
          {
            title: guidedSessions > 0 ? "Openness to Guidance" : "Self-Directed",
            description: guidedSessions > 0
              ? "You're receptive to structured support and guided reflection exercises."
              : "You prefer setting your own conversation direction and topics.",
            confidence: 82
          },
          {
            title: sessionData.length > 3 ? "Consistency" : "Initiative",
            description: sessionData.length > 3
              ? "You maintain regular journaling habits, showing commitment to your wellbeing."
              : "You've taken the first steps in your reflective journey.",
            confidence: 75 + Math.min(sessionData.length * 2, 15)
          }
        ]
      },
      {
        category: "Green Flags",
        icon: HeartHandshake,
        items: [
          {
            title: "Seeking Growth",
            description: "By engaging with this platform, you show an active interest in self-reflection and personal development.",
            confidence: 90
          },
          {
            title: "Commitment to Mental Health",
            description: `You've completed ${sessionData.length} ${sessionData.length === 1 ? 'session' : 'sessions'}, demonstrating investment in your emotional wellbeing.`,
            confidence: 85 + Math.min(sessionData.length, 10)
          }
        ]
      },
      {
        category: "Areas for Growth",
        icon: TrendingUp,
        items: [
          {
            title: sessionData.length < 5 ? "Building Consistency" : "Deepening Insights",
            description: sessionData.length < 5
              ? "Regular engagement would help establish patterns and provide more personalized insights."
              : "Exploring diverse topics could reveal new dimensions of your personality and needs.",
            confidence: 75
          },
          {
            title: moodVariety < 2 ? "Emotional Expression" : "Emotional Regulation",
            description: moodVariety < 2
              ? "Acknowledging a wider range of emotions could enhance self-understanding."
              : "Developing strategies to navigate your varying emotional states could be beneficial.",
            confidence: 70
          }
        ]
      }
    ];
    
    // Only add challenges if there are enough sessions for meaningful insight
    if (sessionData.length > 3) {
      generatedInsights.push({
        category: "Potential Challenges",
        icon: AlertTriangle,
        items: [
          {
            title: "Overthinking",
            description: "You might occasionally spend too much time analyzing situations.",
            confidence: 72
          },
          {
            title: moodVariety > 3 ? "Emotional Fluctuation" : "Limited Expression",
            description: moodVariety > 3
              ? "Your mood varies significantly between sessions, which may reflect external stressors."
              : "You might benefit from exploring and expressing a wider range of emotional states.",
            confidence: 68
          }
        ]
      });
    }
    
    setInsightsData(generatedInsights);
  };

  const getConfidenceBadgeColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    if (confidence >= 90) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (confidence >= 80) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (confidence >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  };

  if (sessions.length === 0) {
    return (
      <Card className="border-purple-200 dark:border-purple-900">
        <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[200px]">
          <Brain className="h-12 w-12 text-purple-300 dark:text-purple-900 mb-4 opacity-50" />
          <p className="text-gray-500 dark:text-gray-400">
            No session data available to generate insights.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Start a conversation to build your profile analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-purple-700 dark:text-purple-300">personality type</CardTitle>
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            Based on {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </Badge>
        </div>
        <CardDescription>An automated analysis of your personality traits, strengths, and growth opportunities based on your conversations</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-0">
        <ScrollArea className="h-[380px] pr-4">
          <div className="space-y-6">
            {insightsData.map((category, idx) => (
              <div key={idx} className="pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <category.icon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  <h3 className="font-medium text-lg text-purple-700 dark:text-purple-300">{category.category}</h3>
                </div>
                <div className="grid gap-3">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.confidence && (
                          <Badge variant="outline" className={getConfidenceBadgeColor(item.confidence)}>
                            {item.confidence}% confidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UserInsightsReport;
