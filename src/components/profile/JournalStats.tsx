
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Calendar, PenSquare } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  wordCount: number;
  tags?: string[];
  mood?: number;
}

const JournalStats = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "1",
      date: "2025-05-03",
      title: "Morning Reflection",
      content: "Today I woke up feeling refreshed. I had a good night's sleep and I'm ready to tackle the day. My focus is on making progress with my personal goals.",
      wordCount: 26,
      tags: ["morning", "reflection", "goals"],
      mood: 4
    },
    {
      id: "2", 
      date: "2025-05-04",
      title: "Evening Thoughts",
      content: "Today was a bit challenging. I struggled with focus and didn't accomplish all I had hoped. Tomorrow is another day to try again.",
      wordCount: 20,
      tags: ["evening", "challenges"],
      mood: 3
    },
    {
      id: "3",
      date: "2025-05-05",
      title: "Weekly Planning",
      content: "Setting goals for this week: 1) Complete project report, 2) Start meditation practice, 3) Call family members.",
      wordCount: 17,
      tags: ["planning", "goals"],
      mood: 4
    }
  ]);
  
  const [stats, setStats] = useState({
    totalEntries: 3,
    averageWords: 21,
    streakDays: 3,
    lastEntry: "2025-05-05",
    topTags: ["goals", "reflection", "planning"]
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load journal entries from localStorage if available
    const storedEntries = localStorage.getItem('journalEntries');
    if (storedEntries) {
      const parsedEntries = JSON.parse(storedEntries);
      
      // Add word count to entries if not present
      const entriesWithWordCount = parsedEntries.map((entry: any) => ({
        ...entry,
        wordCount: entry.wordCount || 
          (entry.content ? entry.content.split(/\s+/).filter(Boolean).length : 0)
      }));
      
      setEntries(entriesWithWordCount);
      calculateStats(entriesWithWordCount);
    }
  }, []);
  
  const calculateStats = (journalEntries: JournalEntry[]) => {
    if (!journalEntries.length) return;
    
    // Sort entries by date (newest first)
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Calculate statistics
    const totalWords = journalEntries.reduce((acc, entry) => acc + entry.wordCount, 0);
    const averageWords = Math.round(totalWords / journalEntries.length);
    const lastEntry = sortedEntries[0]?.date;
    
    // Calculate streak (consecutive days)
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const uniqueDates = new Set(journalEntries.map(entry => entry.date));
    
    // Check if there's an entry today
    if (uniqueDates.has(today)) {
      streak = 1;
      
      // Check for consecutive previous days
      let currentDate = new Date();
      while (true) {
        currentDate.setDate(currentDate.getDate() - 1);
        const dateString = currentDate.toISOString().split('T')[0];
        if (uniqueDates.has(dateString)) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    // Calculate top tags
    const tagCounts: Record<string, number> = {};
    journalEntries.forEach(entry => {
      if (entry.tags && entry.tags.length) {
        entry.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Get top 3 tags
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
    
    setStats({
      totalEntries: journalEntries.length,
      averageWords,
      streakDays: streak,
      lastEntry,
      topTags
    });
  };

  const navigateToJournal = () => {
    navigate('/journal');
  };

  const formatPreviewDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  };

  const getMoodEmoji = (mood?: number) => {
    switch (mood) {
      case 1: return "😔";
      case 2: return "🙁";
      case 3: return "😐";
      case 4: return "🙂";
      case 5: return "😄";
      default: return "";
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900 overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenSquare className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-blue-700 dark:text-blue-300">journal entries</CardTitle>
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Your writing
          </Badge>
        </div>
        <CardDescription className="text-blue-600/70 dark:text-blue-400/70">Track your thoughts and reflections</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="secondary" className="font-normal bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {stats.totalEntries} Entries
          </Badge>
          <Badge variant="secondary" className="font-normal bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {stats.averageWords} Avg. Words
          </Badge>
          <Badge variant="secondary" className="font-normal bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {stats.streakDays} Day Streak
          </Badge>
        </div>
        
        {entries.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">Recent Entries</h3>
            <div className="space-y-2">
              {entries.slice(0, 3).map((entry) => (
                <div 
                  key={entry.id} 
                  className="p-3 bg-white/90 dark:bg-gray-800/50 rounded-md cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-blue-100 dark:border-blue-900/30"
                  onClick={navigateToJournal}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {formatPreviewDate(entry.date)}
                      </span>
                      {entry.mood && <span className="ml-2">{getMoodEmoji(entry.mood)}</span>}
                    </div>
                    <span className="text-xs text-blue-600/70 dark:text-blue-400/70">{entry.wordCount} words</span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2 text-gray-600 dark:text-gray-300">
                    {entry.content}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-sm">
                          {tag}
                        </span>
                      ))}
                      {entry.tags.length > 2 && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-sm">
                          +{entry.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-10 w-10 text-blue-300 mb-2" />
            <p className="text-blue-600/70 dark:text-blue-400/70 mb-2">No journal entries yet</p>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 dark:border-blue-800" onClick={navigateToJournal}>
              Create your first entry
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-blue-100 dark:border-blue-900/50 p-4">
        <Button variant="outline" size="sm" className="ml-auto text-blue-600 hover:text-blue-700 border-blue-200 dark:border-blue-800 flex items-center gap-1" onClick={navigateToJournal}>
          View All <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JournalStats;
