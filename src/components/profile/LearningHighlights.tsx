
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowUpRight } from "lucide-react";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
  conversation?: {role: string, content: string}[];
}

interface LearningHighlightsProps {
  sessions?: Session[];
}

const LearningHighlights: React.FC<LearningHighlightsProps> = ({ sessions = [] }) => {
  // Generate highlights based on session data
  const generateHighlights = () => {
    if (sessions.length === 0) {
      return [];
    }
    
    // Extract potential insights from conversations
    const insights = [];
    
    // 1. Most active time period
    const timeData = sessions.map(s => {
      const date = new Date(s.date);
      return date.getHours();
    });
    
    const timeCounter: Record<string, number> = {};
    timeData.forEach(hour => {
      const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      timeCounter[period] = (timeCounter[period] || 0) + 1;
    });
    
    const mostActiveTime = Object.entries(timeCounter).sort((a, b) => b[1] - a[1])[0];
    if (mostActiveTime) {
      insights.push({
        title: "Peak Activity Time",
        description: `You tend to engage most during the ${mostActiveTime[0]}, which may be when you feel most reflective.`,
        category: "Patterns"
      });
    }
    
    // 2. Communication style
    const textSessions = sessions.filter(s => s.type === 'text').length;
    const voiceSessions = sessions.filter(s => s.type === 'voice').length;
    
    if (textSessions > voiceSessions) {
      insights.push({
        title: "Written Expression",
        description: "You prefer text-based communication, which may indicate you value time to think through responses.",
        category: "Style"
      });
    } else if (voiceSessions > textSessions) {
      insights.push({
        title: "Verbal Processor",
        description: "You favor voice interactions, suggesting you may process thoughts best through speaking.",
        category: "Style"
      });
    }
    
    // 3. Mood patterns
    const moodCounts: Record<string, number> = {};
    sessions.forEach(s => {
      moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
    });
    
    const moodEntries = Object.entries(moodCounts);
    const totalMoods = moodEntries.reduce((sum, [_, count]) => sum + count, 0);
    const dominantMood = moodEntries.sort((a, b) => b[1] - a[1])[0];
    
    if (dominantMood && (dominantMood[1] / totalMoods > 0.5)) {
      insights.push({
        title: "Emotional Tendency",
        description: `You frequently report feeling "${dominantMood[0]}", which appears to be your baseline emotional state.`,
        category: "Emotion"
      });
    }
    
    // 4. Session duration (if we had that data)
    insights.push({
      title: "Growth Mindset",
      description: "Your continued engagement shows commitment to self-reflection and personal development.",
      category: "Mindset"
    });
    
    // 5. Topic analysis (simplified)
    const allUserContent = sessions
      .flatMap(s => s.conversation || [])
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase());
      
    const hasGoals = allUserContent.some(content => 
      content.includes("goal") || content.includes("aim") || content.includes("want to")
    );
    
    if (hasGoals) {
      insights.push({
        title: "Goal-Oriented",
        description: "You discuss goals and aspirations, showing a forward-thinking, achievement-focused mindset.",
        category: "Mindset"
      });
    }
    
    return insights.slice(0, 4); // Return top insights
  };

  const highlights = generateHighlights();

  return (
    <Card className="border-green-200 dark:border-green-900 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-950">
      <CardContent className="p-6">
        {highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6">
            <Lightbulb className="h-10 w-10 text-green-300 dark:text-green-800 mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-green-700 dark:text-green-400 mb-2">No Insights Yet</h3>
            <p className="text-sm text-green-600/70 dark:text-green-400/70">
              Complete more sessions to reveal learning patterns and insights.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {highlights.map((insight, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-green-100 dark:border-green-900/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-green-500" />
                    <h3 className="font-medium text-green-700 dark:text-green-300">{insight.title}</h3>
                  </div>
                  <Badge variant="outline" className="bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                    {insight.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{insight.description}</p>
                
                <div className="mt-2 flex justify-end">
                  <button className="inline-flex items-center text-xs text-green-600 dark:text-green-400 hover:underline">
                    Learn more <ArrowUpRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningHighlights;
