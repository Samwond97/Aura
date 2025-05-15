
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type MoodColor = "yellow" | "blue" | "green" | "purple" | "pink" | "orange";

interface MoodOrbProps {
  className?: string;
  mood?: string;
}

const getMoodColor = (mood?: string): MoodColor => {
  // Logic to determine mood color based on user's mood or time of day
  if (!mood) {
    // Default based on time of day
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 10) return "orange"; // Morning
    if (hour >= 10 && hour < 15) return "yellow"; // Midday
    if (hour >= 15 && hour < 19) return "blue"; // Afternoon
    if (hour >= 19 && hour < 22) return "purple"; // Evening
    return "blue"; // Night
  }
  
  // Map mood strings to colors
  switch(mood.toLowerCase()) {
    case "happy": case "joyful": case "excited": return "yellow";
    case "calm": case "relaxed": case "peaceful": return "blue";
    case "balanced": case "content": case "grateful": return "green";
    case "reflective": case "thoughtful": case "creative": return "purple";
    case "loving": case "compassionate": case "warm": return "pink";
    case "energetic": case "motivated": case "enthusiastic": return "orange";
    default: return "yellow";
  }
};

const MoodOrb = ({ className, mood }: MoodOrbProps) => {
  const [moodColor, setMoodColor] = useState<MoodColor>(() => getMoodColor(mood));
  
  useEffect(() => {
    setMoodColor(getMoodColor(mood));
  }, [mood]);

  // Map color names to tailwind classes
  const colorMap = {
    yellow: "bg-aura-yellow orb-shadow",
    blue: "bg-aura-blue orb-shadow-blue",
    green: "bg-aura-green orb-shadow-green",
    purple: "bg-aura-purple",
    pink: "bg-aura-pink",
    orange: "bg-aura-orange",
  };

  return (
    <div 
      className={cn(
        "w-64 h-64 rounded-full animate-pulse-slow", 
        colorMap[moodColor],
        className
      )}
    />
  );
};

export default MoodOrb;
