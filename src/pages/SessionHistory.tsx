
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Mic, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Session {
  id: number;
  date: string;
  type: string;
  mood: string;
  summary: string;
  conversation?: {role: string, content: string}[];
}

const SessionHistory = () => {
  const [filter, setFilter] = useState("all");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  
  useEffect(() => {
    // Load session history from localStorage
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('sessionHistory');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setSessions(parsedHistory);
        }
      } catch (error) {
        console.error("Error loading session history:", error);
      }
    };
    
    loadHistory();
  }, []);
  
  // Filter sessions based on selected filter
  const filteredSessions = sessions.filter(session => {
    if (filter === "all") return true;
    return session.type === filter;
  });
  
  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionDetail(true);
  };
  
  const formatDate = (dateStr: string) => {
    return dateStr || "Unknown date";
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium">session history</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="filter" className="text-sm text-muted-foreground">
              Filter:
            </Label>
            <Select defaultValue={filter} onValueChange={setFilter}>
              <SelectTrigger id="filter" className="w-[160px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="text">Text Only</SelectItem>
                <SelectItem value="voice">Voice Only</SelectItem>
                <SelectItem value="guided">Guided Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map(session => (
            <Card 
              key={session.id} 
              className="hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => handleSessionClick(session)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{formatDate(session.date)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{session.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full flex items-center gap-1">
                      {session.type === "text" ? (
                        <MessageSquare className="h-3 w-3" />
                      ) : session.type === "voice" ? (
                        <Mic className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      {session.type}
                    </span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {session.mood}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No session history yet</p>
          </div>
        )}
      </div>
      
      {/* Session Detail Dialog with better styling for conversation display */}
      <Dialog open={showSessionDetail} onOpenChange={setShowSessionDetail}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Session from {selectedSession?.date}</DialogTitle>
            <DialogDescription>
              {selectedSession?.type} session - {selectedSession?.mood}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] mt-4 pr-4">
            {selectedSession?.conversation?.map((message, i) => (
              <div 
                key={i}
                className={`mb-4 p-3 rounded-lg ${
                  message.role === "user" 
                    ? "bg-primary/10 ml-8" 
                    : "bg-secondary/50 mr-8"
                }`}
              >
                <p className="text-xs mb-1 text-muted-foreground">
                  {message.role === "user" ? "You" : "Therapist"}:
                </p>
                <p>{message.content}</p>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionHistory;
