import { useState } from "react";
import MoodOrb from "@/components/home/MoodOrb";
import TimeGreeting from "@/components/home/TimeGreeting";
import SessionCounter from "@/components/home/SessionCounter";
import SessionModeDialog from "@/components/home/SessionModeDialog";
import TextChat from "@/components/chat/TextChat";
import VoiceChat from "@/components/chat/VoiceChat";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "react-router-dom";

const Index = () => {
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [activeMode, setActiveMode] = useState<"text" | "voice" | "video" | null>(null);
  
  // Get language from context
  const { language } = useLanguage();

  const handleStartSession = () => {
    setShowModeDialog(true);
  };

  const handleSelectCommunicationMode = async (mode: "text" | "voice" | "video") => {
    setShowModeDialog(false);
    setActiveMode(mode);
    
    // Hide the navbar when entering a session
    const navbarElement = document.querySelector('nav');
    if (navbarElement) {
      navbarElement.classList.add('hidden');
    }
    
    toast.success(`Starting ${mode} session in ${language} mode`);
  };
  
  const handleBackToHome = () => {
    setActiveMode(null);
    
    // Show the navbar when returning to home
    const navbarElement = document.querySelector('nav');
    if (navbarElement) {
      navbarElement.classList.remove('hidden');
    }
  };

  if (activeMode === "text") {
    return <TextChat onBack={handleBackToHome} language={language} />;
  }

  if (activeMode === "voice") {
    return <VoiceChat language={language} />;
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="w-full max-w-md flex flex-col items-center">
          <TimeGreeting 
            className="mb-16 text-center"
            language={language}
          />
          
          <div className="relative mb-16">
            <MoodOrb className="mx-auto" />
          </div>
          
          <div className="w-full flex flex-col items-center gap-6">
            <Button 
              className="w-full bg-aura-yellow hover:bg-amber-400 text-black font-medium py-6 rounded-md text-lg"
              onClick={handleStartSession}
            >
              begin session
            </Button>
            
            <SessionCounter className="mt-2" />
          </div>
        </div>
      </div>

      <SessionModeDialog 
        isOpen={showModeDialog}
        onClose={() => setShowModeDialog(false)}
        onSelectMode={handleSelectCommunicationMode}
      />
    </div>
  );
};

export default Index;
