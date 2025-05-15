
import { useEffect, useState } from "react";

interface SessionCounterProps {
  className?: string;
}

const SessionCounter = ({ className }: SessionCounterProps) => {
  const [sessionCount, setSessionCount] = useState(1);
  const maxSessions = 3;
  
  // For a real app, this would fetch from API/localStorage
  useEffect(() => {
    // Simulate loading session count from storage or API
    const savedCount = localStorage.getItem("sessionCount");
    if (savedCount) {
      setSessionCount(parseInt(savedCount, 10));
    }
  }, []);

  return (
    <div className={`text-sm text-center ${className}`}>
      <p className="text-muted-foreground">
        {sessionCount}/{maxSessions} free sessions today
      </p>
    </div>
  );
};

export default SessionCounter;
