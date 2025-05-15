
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
  conversation?: {role: string, content: string}[];
}

interface UniqueTraitsProps {
  sessions?: Session[];
}

const UniqueTraits: React.FC<UniqueTraitsProps> = ({ sessions = [] }) => {
  // Generate traits based on session data
  const generateTraits = () => {
    if (sessions.length === 0) return [];
    
    const traits = [];
    
    // Communication style trait
    const textCount = sessions.filter(s => s.type === 'text').length;
    const voiceCount = sessions.filter(s => s.type === 'voice').length;
    const guidedCount = sessions.filter(s => s.type === 'guided').length;
    
    if (textCount > voiceCount && textCount > guidedCount) {
      traits.push({
        name: "Written Processor",
        description: "You express yourself most comfortably through writing, allowing thoughtful reflection.",
        strength: 80 + Math.min(textCount * 2, 20)
      });
    } else if (voiceCount > textCount && voiceCount > guidedCount) {
      traits.push({
        name: "Verbal Communicator",
        description: "You prefer speaking your thoughts, embracing spontaneous verbal expression.",
        strength: 80 + Math.min(voiceCount * 2, 20)
      });
    } else if (guidedCount > 0) {
      traits.push({
        name: "Structured Thinker",
        description: "You value guidance and frameworks when exploring personal topics.",
        strength: 80 + Math.min(guidedCount * 3, 20)
      });
    }
    
    // Consistency trait
    if (sessions.length > 5) {
      traits.push({
        name: "Dedicated Self-Explorer",
        description: "Your consistent engagement shows commitment to personal growth and reflection.",
        strength: 85 + Math.min(sessions.length, 15)
      });
    } else {
      traits.push({
        name: "Curious Learner",
        description: "You show interest in self-discovery and personal insight development.",
        strength: 75 + sessions.length * 2
      });
    }
    
    // Mood variety trait
    const uniqueMoods = new Set(sessions.map(s => s.mood)).size;
    if (uniqueMoods >= 3) {
      traits.push({
        name: "Emotionally Expressive",
        description: "You're aware of and comfortable expressing a range of emotional states.",
        strength: 80 + Math.min(uniqueMoods * 3, 20)
      });
    } else {
      traits.push({
        name: "Emotionally Consistent",
        description: "You maintain relatively stable emotional states across interactions.",
        strength: 85
      });
    }
    
    // Time of day trait
    const hourCounts: Record<string, number> = {};
    sessions.forEach(s => {
      const hour = new Date(s.date).getHours();
      const timeCategory = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
      hourCounts[timeCategory] = (hourCounts[timeCategory] || 0) + 1;
    });
    
    const preferredTime = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (preferredTime) {
      const [timeCategory, count] = preferredTime;
      const percentage = Math.round((count / sessions.length) * 100);
      if (percentage > 60) {
        traits.push({
          name: `${timeCategory} Reflector`,
          description: `You tend to engage in reflective activities during the ${timeCategory.toLowerCase()}.`,
          strength: 70 + Math.min(percentage - 60, 30)
        });
      }
    }
    
    // Topic trait (simplified)
    traits.push({
      name: "Self-Aware",
      description: "You engage in reflective conversations about yourself and your experiences.",
      strength: 80
    });
    
    return traits;
  };
  
  const traits = generateTraits();

  const getStrengthColor = (strength: number) => {
    if (strength >= 95) return "bg-indigo-500";
    if (strength >= 90) return "bg-indigo-400";
    if (strength >= 85) return "bg-indigo-400/90";
    if (strength >= 80) return "bg-indigo-400/80";
    return "bg-indigo-400/70";
  };

  return (
    <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
      <CardContent className="p-6">
        {traits.length === 0 ? (
          <div className="min-h-[200px] flex items-center justify-center text-center">
            <div>
              <p className="text-indigo-600/70 dark:text-indigo-400/70 font-medium mb-2">No Traits Identified Yet</p>
              <p className="text-xs text-indigo-600/50 dark:text-indigo-400/50">
                Complete more sessions to reveal your unique personality traits.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-5">
              {traits.map((trait, idx) => (
                <div key={idx} className="bg-white/90 dark:bg-gray-800/50 rounded-lg p-4 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="mb-2 flex justify-between">
                    <h3 className="font-medium text-indigo-700 dark:text-indigo-300">{trait.name}</h3>
                    <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70">{trait.strength}% match</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{trait.description}</p>
                  
                  <div className="h-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-full">
                    <div 
                      className={`h-1 rounded-full ${getStrengthColor(trait.strength)}`}
                      style={{ width: `${trait.strength}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default UniqueTraits;
