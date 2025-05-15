
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { toast } from "sonner";
import { Toggle, toggleVariants } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface MoodEntry {
  date: string;
  value: number;
  note?: string;
}

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
}

const MoodVisualization = () => {
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  
  useEffect(() => {
    // Load session history from localStorage to extract mood data
    const storedHistory = localStorage.getItem('sessionHistory');
    if (storedHistory) {
      try {
        const sessionHistory: Session[] = JSON.parse(storedHistory);
        
        // Transform session history into mood entries
        const extractedMoodData: MoodEntry[] = sessionHistory.map(session => {
          // Convert mood strings to numeric values (1-5)
          let moodValue = 3; // Default to neutral
          
          if (session.mood) {
            const moodLower = session.mood.toLowerCase();
            if (moodLower.includes('great') || moodLower.includes('amazing') || moodLower.includes('excellent')) {
              moodValue = 5;
            } else if (moodLower.includes('good') || moodLower.includes('happy') || moodLower.includes('positive')) {
              moodValue = 4;
            } else if (moodLower.includes('okay') || moodLower.includes('fine') || moodLower.includes('neutral')) {
              moodValue = 3;
            } else if (moodLower.includes('poor') || moodLower.includes('sad') || moodLower.includes('unhappy')) {
              moodValue = 2;
            } else if (moodLower.includes('bad') || moodLower.includes('terrible') || moodLower.includes('awful')) {
              moodValue = 1;
            }
          }
          
          return {
            date: session.date,
            value: moodValue,
            note: session.summary
          };
        });
        
        // Sort by date (oldest to newest)
        extractedMoodData.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        setMoodData(extractedMoodData);
      } catch (error) {
        console.error("Error parsing session history:", error);
        provideSampleData();
      }
    } else {
      provideSampleData();
    }
    
    // Check for stored notification preference on component mount
    const storedNotificationPref = localStorage.getItem('moodNotifications') === 'true';
    setNotificationsEnabled(storedNotificationPref);
  }, []);

  const provideSampleData = () => {
    // Provide sample data if no history exists
    const currentDate = new Date();
    const sampleData: MoodEntry[] = [
      { date: new Date(currentDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 3, note: 'Started using the app' },
      { date: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 4, note: 'Had a good therapy session' },
      { date: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 2, note: 'Difficult day at work' },
      { date: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 3, note: 'Feeling better today' },
      { date: currentDate.toISOString().split('T')[0], value: 4, note: 'Making progress!' },
    ];
    
    setMoodData(sampleData);
  };

  const addMoodEntry = () => {
    // Navigate to session page to start a new session
    window.location.href = '/';
    toast.success("Starting a new session to track your mood");
  };

  const toggleNotifications = () => {
    if (Notification.permission !== 'granted' && !notificationsEnabled) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('moodNotifications', 'true');
          toast.success("Mood reminders enabled");
          
          // Schedule a test notification after 5 seconds
          setTimeout(() => {
            new Notification("Mood Tracker Reminder", {
              body: "How are you feeling today?",
              icon: "/favicon.ico"
            });
          }, 5000);
        }
      });
    } else {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      localStorage.setItem('moodNotifications', newState.toString());
      toast.success(newState ? "Reminders enabled" : "Reminders disabled");
    }
  };

  // Color mapping for different mood values
  const getMoodColor = (value: number): string => {
    const colors = ['#FF6B6B', '#FF9E7A', '#FFDF8C', '#A0E7A0', '#7EC8E3'];
    return colors[value - 1] || colors[2];
  };

  // Get gradient for area chart
  const getGradientId = () => 'moodGradient';
  
  // Custom dot component that changes color based on mood value
  const CustomDot = (props: any) => {
    const { cx, cy, value } = props;
    const color = getMoodColor(value);
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={6} 
        stroke="#8B5CF6" 
        strokeWidth={2} 
        fill={color} 
      />
    );
  };

  return (
    <Card className="border-purple-200 dark:border-purple-900 overflow-hidden bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <CardHeader className="flex flex-row items-center justify-between bg-purple-50/50 dark:bg-purple-900/20">
        <div>
          <CardTitle className="text-purple-900 dark:text-purple-200">mood trends</CardTitle>
          <CardDescription>Your emotional journey over time</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleNotifications}
            className={cn(
              notificationsEnabled ? "bg-blue-100 dark:bg-blue-900/30" : "",
              "border-purple-200 dark:border-purple-700"
            )}
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={addMoodEntry} 
            className="border-purple-200 dark:border-purple-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 flex justify-end">
          <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as 'line' | 'area')}>
            <ToggleGroupItem value="line" aria-label="Line chart">Line</ToggleGroupItem>
            <ToggleGroupItem value="area" aria-label="Area chart">Area</ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="h-[220px]">
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart
                  data={moodData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }}
                    stroke="#9CA3AF"
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    stroke="#9CA3AF" 
                  />
                  <Tooltip 
                    formatter={(value, name) => [`Mood Level: ${value}`, '']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      borderColor: '#E9D5FF',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={<CustomDot />}
                    activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <AreaChart
                  data={moodData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }}
                    stroke="#9CA3AF"
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    stroke="#9CA3AF"
                  />
                  <Tooltip 
                    formatter={(value, name) => [`Mood Level: ${value}`, '']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      borderColor: '#E9D5FF',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={`url(#${getGradientId()})`}
                    dot={<CustomDot />}
                    activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted rounded-md">
              <p className="text-muted-foreground">No mood data available</p>
            </div>
          )}
        </div>

        {/* Mood level indicators */}
        <div className="mt-4 flex justify-between px-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-400 mr-1"></div>
            <span>Bad</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-orange-300 mr-1"></div>
            <span>Poor</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-yellow-300 mr-1"></div>
            <span>Okay</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-300 mr-1"></div>
            <span>Good</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-300 mr-1"></div>
            <span>Great</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodVisualization;
