
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, Clock, MessageSquare, Settings, LogOut, Book } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();
  const [sessionCount, setSessionCount] = useState(1);
  const maxSessions = 3;

  useEffect(() => {
    // Update session count from local storage if available
    const loadSessionCount = () => {
      try {
        const storedHistory = localStorage.getItem('sessionHistory');
        if (storedHistory) {
          const sessions = JSON.parse(storedHistory);
          // Limit displayed count to max (for free tier)
          setSessionCount(Math.min(sessions.length, maxSessions));
        }
      } catch (error) {
        console.error("Error loading session count:", error);
      }
    };
    
    loadSessionCount();
  }, []);

  const navItems = [
    { name: "home", path: "/", icon: Home },
    { name: "journal", path: "/journal", icon: Book },
    { name: "profile", path: "/profile", icon: User },
    { name: "session history", path: "/session-history", icon: Clock },
    { name: "feedback", path: "/feedback", icon: MessageSquare },
    { name: "settings", path: "/settings", icon: Settings },
  ];

  return (
    <nav className="w-[224px] min-h-screen border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between">
      <div>
        <div className="p-6">
          <Link to="/" className="text-2xl font-semibold">
            aura bloom
          </Link>
        </div>

        <div className="px-3 py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors",
                location.pathname === item.path
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">free</span>
            <span className="text-muted-foreground">{sessionCount}/{maxSessions} sessions</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-aura-blue rounded-full transition-all" 
              style={{ width: `${(sessionCount / maxSessions) * 100}%` }}
            ></div>
          </div>
          <button className="w-full py-2 rounded-md bg-aura-yellow hover:bg-amber-400 text-black font-medium transition-colors">
            upgrade
          </button>
        </div>

        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <LogOut size={18} />
          <span>log out</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
