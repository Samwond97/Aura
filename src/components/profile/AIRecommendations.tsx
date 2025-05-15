
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Activity, Book, Heart, Coffee } from "lucide-react";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
  conversation?: {role: string, content: string}[];
}

interface AIRecommendationsProps {
  sessions?: Session[];
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ sessions = [] }) => {
  // Generate recommendations based on session data
  const generateRecommendations = () => {
    if (sessions.length === 0) return [];
    
    const recommendations = [];
    
    // Basic recommendations based on session count
    if (sessions.length < 5) {
      recommendations.push({
        title: "Regular Check-ins",
        description: "Try to engage in more frequent reflection sessions to build consistent insights.",
        icon: Activity
      });
    }
    
    // Recommendations based on mood patterns
    const moods = sessions.map(s => s.mood.toLowerCase());
    const moodCounts: Record<string, number> = {};
    moods.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    
    const negativeMoods = ['sad', 'anxious', 'stressed', 'angry', 'depressed', 'tired'];
    const hasNegativeMoods = negativeMoods.some(mood => moodCounts[mood] && moodCounts[mood] > 0);
    
    if (hasNegativeMoods) {
      recommendations.push({
        title: "Mindfulness Practice",
        description: "Consider incorporating brief mindfulness exercises to help manage stress and difficult emotions.",
        icon: Brain
      });
    }
    
    // Recommendation based on session type
    const textSessions = sessions.filter(s => s.type === 'text').length;
    const voiceSessions = sessions.filter(s => s.type === 'voice').length;
    
    if (textSessions > voiceSessions * 2) {
      recommendations.push({
        title: "Voice Conversations",
        description: "Try voice sessions for a more spontaneous experience that may reveal different insights.",
        icon: Coffee
      });
    } else if (voiceSessions > textSessions * 2) {
      recommendations.push({
        title: "Written Reflection",
        description: "Supplement your voice sessions with written journaling to capture more considered thoughts.",
        icon: Book
      });
    }
    
    // General wellbeing recommendation
    recommendations.push({
      title: "Gratitude Practice",
      description: "Take a moment each day to note three things you're grateful for to enhance wellbeing.",
      icon: Heart
    });
    
    return recommendations;
  };
  
  const recommendations = generateRecommendations();

  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950">
      <CardContent className="p-6">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <Brain className="h-10 w-10 text-amber-300 dark:text-amber-700 mb-3 opacity-50" />
            <p className="text-amber-600/70 dark:text-amber-400/70">
              Complete sessions to receive personalized recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white/90 dark:bg-gray-800/50 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-amber-100 dark:bg-amber-900/30 w-8 h-8 rounded-full flex items-center justify-center">
                    <rec.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-medium text-amber-700 dark:text-amber-300">{rec.title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 pl-11">{rec.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
