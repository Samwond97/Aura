
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import UserInsightsReport from "@/components/profile/UserInsightsReport";
import UniqueTraits from "@/components/profile/UniqueTraits";
import ProgressTracker from "@/components/profile/ProgressTracker";
import UserInteractionSummary from "@/components/profile/UserInteractionSummary";
import LearningHighlights from "@/components/profile/LearningHighlights";
import AIRecommendations from "@/components/profile/AIRecommendations";
import MoodTrends from "@/components/profile/MoodTrends";
import PersonalGoals from "@/components/profile/PersonalGoals";
import JournalStats from "@/components/profile/JournalStats";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
  conversation?: {role: string, content: string}[];
}

const Profile: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hasHistory, setHasHistory] = useState(false);
  
  useEffect(() => {
    // Load session history from localStorage
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('sessionHistory');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setSessions(parsedHistory);
          setHasHistory(parsedHistory.length > 0);
        }
      } catch (error) {
        console.error("Error loading session history:", error);
      }
    };
    
    loadHistory();
  }, []);

  if (!hasHistory) {
    return (
      <div className="container py-6 bg-white dark:bg-gray-950 min-h-screen mx-auto flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-4 px-6 text-center">
            <h1 className="text-2xl font-medium mb-4 text-gray-800 dark:text-gray-100">No Session History</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your profile insights are generated based on your conversations. 
              Start a new session to see personalized analysis here.
            </p>
            <Button asChild className="mt-2">
              <Link to="/">Begin a New Session</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 bg-white dark:bg-gray-950 min-h-screen mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-medium mb-2 text-gray-800 dark:text-gray-100">your profile</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2 max-w-2xl">
          Your personalized dashboard showcasing your emotional journey, insights, and progress based on 
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}.
        </p>
      </header>
      
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-8 px-1 pb-10">
          {/* Main sections layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-medium mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                    1
                  </span>
                  your insights profile
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Get personalized insights about your communication style and patterns
                </p>
                <UserInsightsReport sessions={sessions} />
              </section>
              
              <section>
                <h2 className="text-xl font-medium mb-4 text-teal-600 dark:text-teal-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400">
                    3
                  </span>
                  progress tracker
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Visualizing your growth and behavioral trends
                </p>
                <ProgressTracker sessions={sessions} />
              </section>
              
              <section>
                <h2 className="text-xl font-medium mb-4 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    4
                  </span>
                  interaction patterns
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Understand when and how you engage with the app, revealing your communication preferences
                </p>
                <UserInteractionSummary />
              </section>
              
              <section>
                <h2 className="text-xl font-medium mb-4 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    8
                  </span>
                  personal goals & achievements
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Set, track, and celebrate your personal development goals and milestones
                </p>
                <div className="grid grid-cols-1 gap-6">
                  <PersonalGoals />
                  <JournalStats />
                </div>
              </section>
            </div>
            
            {/* Right column */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-medium mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                    2
                  </span>
                  mood trends
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Track your emotional journey over time
                </p>
                <MoodTrends sessions={sessions} />
              </section>
              
              <section>
                <h2 className="text-xl font-medium mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                    5
                  </span>
                  learning highlights
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Key insights from your interaction patterns
                </p>
                <LearningHighlights sessions={sessions} />
              </section>
              
              <section>
                <h2 className="text-xl font-medium mb-4 text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                    6
                  </span>
                  your unique traits
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Distinctive characteristics and personal attributes that make your perspective special
                </p>
                <UniqueTraits sessions={sessions} />
              </section>
              
              <section>
                <h2 className="text-xl font-medium mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400">
                    7
                  </span>
                  personal recommendations
                  <span className="inline-block ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">ⓘ</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Personalized suggestions to enhance your wellbeing and personal growth journey
                </p>
                <AIRecommendations sessions={sessions} />
              </section>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Profile;
