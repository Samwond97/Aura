
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock } from "lucide-react";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
  conversation?: {role: string, content: string}[];
}

const UserInteractionSummary = () => {
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [totalConvoTime, setTotalConvoTime] = useState<string>("0m");

  useEffect(() => {
    // Load session history from localStorage
    const loadSessionData = () => {
      try {
        const savedHistory = localStorage.getItem('sessionHistory');
        if (savedHistory) {
          const sessions: Session[] = JSON.parse(savedHistory);
          setSessionCount(sessions.length);
          
          // Calculate approximate conversation time (average 3 minutes per session + additional time based on message count)
          let totalMinutes = 0;
          
          sessions.forEach(session => {
            // Base time for each session
            let sessionMinutes = 3;
            
            // Add time based on conversation length if available
            if (session.conversation && session.conversation.length > 0) {
              // Roughly estimate 20 seconds per message
              sessionMinutes += Math.round((session.conversation.length * 20) / 60);
            }
            
            totalMinutes += sessionMinutes;
          });
          
          // Format the total time
          if (totalMinutes < 60) {
            setTotalConvoTime(`${totalMinutes}m`);
          } else {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            setTotalConvoTime(`${hours}h ${minutes > 0 ? minutes + 'm' : ''}`);
          }
        }
      } catch (error) {
        console.error("Error loading session data:", error);
        // Set fallback values
        setSessionCount(0);
        setTotalConvoTime("0m");
      }
    };
    
    loadSessionData();
  }, []);

  return (
    <Card className="border-blue-200 dark:border-blue-900 overflow-hidden shadow-md bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-blue-700 dark:text-blue-300">stats</CardTitle>
        </div>
        <CardDescription className="text-blue-600/70 dark:text-blue-400/70">Your conversation stats</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">sessions</p>
            <p className="text-4xl font-semibold text-gray-800 dark:text-white">{sessionCount}</p>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">total convo time</p>
            <p className="text-4xl font-semibold text-gray-800 dark:text-white">{totalConvoTime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInteractionSummary;
