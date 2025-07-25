import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Outlet,
  useLocation 
} from "react-router-dom";
import { useEffect, useState } from "react";
import { LanguageProvider } from "@/hooks/use-language";
import { ensureUserBucketExists } from './lib/ensureSupabaseBucket';

import Navbar from "@/components/layout/Navbar";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Journal from "./pages/Journal"; 
import JournalEntry from "./pages/JournalEntry";
import SessionHistory from "./pages/SessionHistory";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AuthManager from "@/components/auth/AuthManager";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

const queryClient = new QueryClient();

// Journal route wrapper that handles authentication
const JournalRoutes = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsEnrollment, setNeedsEnrollment] = useState(false);
  
  useEffect(() => {
    // Check if user needs to authenticate
    const needsAuth = !localStorage.getItem('journalAuthDisabled');
    const preferredMethod = localStorage.getItem('preferredAuthMethod');
    
    // Check if user needs to enroll in Face ID
    const faceIdEnrolled = localStorage.getItem('faceIdEnrolled') === 'true';
    const isFaceIdPreferred = preferredMethod === 'face';
    
    // If Face ID is preferred but not enrolled, we need enrollment
    const needsFaceIdEnrollment = isFaceIdPreferred && !faceIdEnrolled;
    setNeedsEnrollment(needsFaceIdEnrollment);
    
    // Only show auth dialog if authentication is enabled and we have a preferred method
    const shouldAuth = needsAuth && preferredMethod !== null;
    
    // Always show auth for enrollment or regular authentication
    setShowAuthDialog(shouldAuth || needsFaceIdEnrollment);
    setIsAuthenticated(!shouldAuth && !needsFaceIdEnrollment);
  }, []);
  
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthDialog(false);
    
    // After successful authentication, enrollment is complete
    setNeedsEnrollment(false);
  };
  
  // If authentication is required but not authenticated yet, show auth dialog
  if (showAuthDialog) {
    return (
      <AuthManager 
        onAuthenticate={handleAuthSuccess} 
        showSkip={false} 
      />
    );
  }
  
  if (!isAuthenticated) {
    return null; // Don't render anything while checking authentication
  }
  
  // Once authenticated, render the journal routes
  return <Outlet />;
};

// Layout component that checks the current route
const AppLayout = () => {
  const location = useLocation();
  const isJournalEntry = location.pathname.includes('/journal/entry');
  const isAuthPage = ['/signin', '/signup', '/'].includes(location.pathname);

  return (
    <div className={`flex min-h-screen ${isJournalEntry || isAuthPage ? 'hide-sidebar' : ''}`}>
      {!isAuthPage && (
        <div data-sidebar="true" className="sidebar-container">
          <Navbar />
        </div>
      )}
      <main data-content="true" className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/home" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Journal routes with authentication wrapper */}
          <Route element={<JournalRoutes />}>
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/entry" element={<JournalEntry />} />
            <Route path="/journal/entry/:id" element={<JournalEntry />} />
          </Route>
          
          <Route path="/session-history" element={<SessionHistory />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  // Initialize Supabase when the app starts
  useEffect(() => {
    // Check and create the user bucket if it doesn't exist
    const initSupabase = async () => {
      try {
        await ensureUserBucketExists();
      } catch (error) {
        console.error('Failed to initialize Supabase storage:', error);
      }
    };
    
    initSupabase();
  }, []);

  // Check for dark mode preference on initial load
  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
