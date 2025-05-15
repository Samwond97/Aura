import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GenZModeToggle from "@/components/ui/GenZModeToggle";
import LanguageSelect from "@/components/ui/LanguageSelect";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Shield } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import AuthSettings from "@/components/auth/AuthSettings";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const { language, setLanguage, uiLanguage } = useLanguage();
  const [voiceType, setVoiceType] = useState(localStorage.getItem("voiceType") || "male");
  const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem("selectedVoice") || "default");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testSpeech, setTestSpeech] = useState<SpeechSynthesisUtterance | null>(null);
  
  useEffect(() => {
    // Initialize test speech
    setTestSpeech(new SpeechSynthesisUtterance());
    
    // Get available voices from the browser
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    
    // Load voices immediately if available
    loadVoices();
    
    // Also set up an event listener for when voices are loaded asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (testSpeech) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Effect to handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);
  
  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem("voiceType", voiceType);
    localStorage.setItem("selectedVoice", selectedVoice);
    localStorage.setItem("selectedLanguage", language);
    toast.success("Settings saved!");
  };
  
  const handleLanguageChange = (value: string) => {
    // This now only affects conversation language, not UI language
    setLanguage(value);
  };
  
  const handleClearHistory = () => {
    // Clear session history from localStorage
    localStorage.removeItem('sessionHistory');
    toast.success("Session history cleared");
  };
  
  const handleExportData = () => {
    // In a real app, this would export user data
    try {
      const sessionHistory = localStorage.getItem('sessionHistory') || '[]';
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(sessionHistory);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "aura_bloom_data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success("Data export prepared");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };
  
  const handleDeleteAccount = () => {
    // In a real app, this would delete account after confirmation
    toast.error("Account deletion requested");
  };
  
  const handleVoiceTypeChange = (value: string) => {
    setVoiceType(value);
    
    // Reset selected voice when voice type changes
    if (value === "female") {
      const femaleVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('girl')
      );
      setSelectedVoice(femaleVoice?.name || "default");
    } else if (value === "male") {
      const maleVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') || 
        voice.name.toLowerCase().includes('guy')
      );
      setSelectedVoice(maleVoice?.name || "default");
    }
  };
  
  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
  };
  
  const handleTestVoice = () => {
    if (testSpeech) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Set test message
      testSpeech.text = "Hello, this is a test of your selected voice settings. How does it sound?";
      
      // Apply current voice settings
      const voices = window.speechSynthesis.getVoices();
      
      if (selectedVoice !== "default") {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
          testSpeech.voice = voice;
        }
      } else {
        // If no specific voice is selected, use voice type preference
        if (voiceType === "female") {
          const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes("female"));
          if (femaleVoice) testSpeech.voice = femaleVoice;
        } else if (voiceType === "male") {
          const maleVoice = voices.find(voice => voice.name.toLowerCase().includes("male"));
          if (maleVoice) testSpeech.voice = maleVoice;
        }
      }
      
      // Speak the test message
      window.speechSynthesis.speak(testSpeech);
    }
  };
  
  // Filter voices based on selected voice type
  const filteredVoices = availableVoices.filter(voice => {
    if (voiceType === "female") {
      return voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('woman') ||
             voice.name.toLowerCase().includes('girl');
    } else if (voiceType === "male") {
      return voice.name.toLowerCase().includes('male') || 
             voice.name.toLowerCase().includes('man') || 
             voice.name.toLowerCase().includes('guy');
    }
    return true;
  });
  
  return (
    <div className="container py-8 max-w-2xl animate-fade-in">
      <h1 className="text-3xl font-medium mb-8">settings</h1>
      
      <Tabs defaultValue="appearance" className="space-y-8">
        <TabsList>
          <TabsTrigger value="appearance">appearance</TabsTrigger>
          <TabsTrigger value="security">security</TabsTrigger>
          <TabsTrigger value="language">language</TabsTrigger>
          <TabsTrigger value="notifications">notifications</TabsTrigger>
          <TabsTrigger value="voice">voice</TabsTrigger>
          <TabsTrigger value="privacy">privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>appearance</CardTitle>
              <CardDescription>Customize how Aura Bloom looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">dark mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark mode for a calming nighttime experience
                  </p>
                </div>
                <Switch 
                  id="dark-mode" 
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gen-z-mode">gen z mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch to a more casual, emoji-rich conversational style
                  </p>
                </div>
                <GenZModeToggle onChange={(enabled) => {
                  localStorage.setItem("genZMode", enabled.toString());
                  toast.success(enabled ? "Gen Z mode activated!" : "Gen Z mode deactivated");
                }} />
              </div>
              
              <Button 
                className="w-full bg-aura-yellow hover:bg-amber-400 text-black"
                onClick={handleSave}
              >
                save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="space-y-2 mb-6">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Journal Security
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure authentication methods and security options for your private journal
            </p>
          </div>
          
          <AuthSettings
            onSave={() => toast.success("Security settings saved successfully")}
          />
        </TabsContent>
        
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>language settings</CardTitle>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>display language</Label>
                  <p className="text-sm text-muted-foreground">
                    Select the language for the interface
                  </p>
                </div>
                <LanguageSelect onChange={handleLanguageChange} defaultValue={language} />
              </div>
              
              <Button 
                className="w-full bg-aura-yellow hover:bg-amber-400 text-black"
                onClick={handleSave}
              >
                save language preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">daily check-in reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to check in with yourself daily
                  </p>
                </div>
                <Switch 
                  id="notifications" 
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              
              <div>
                <Label htmlFor="reminder-time">reminder time</Label>
                <input
                  id="reminder-time"
                  type="time"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  disabled={!notificationsEnabled}
                  placeholder="Set reminder time"
                  title="Daily reminder time"
                />
              </div>
              
              <Button 
                className="w-full bg-aura-yellow hover:bg-amber-400 text-black"
                onClick={handleSave}
              >
                save notification settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>voice settings</CardTitle>
              <CardDescription>Choose how your AI companion sounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>voice type</Label>
                <RadioGroup 
                  value={voiceType} 
                  onValueChange={handleVoiceTypeChange}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">soft female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">calm male</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="voice-selection">voice selection</Label>
                <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    {filteredVoices.map(voice => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select a specific voice for your AI companion
                </p>
              </div>
              
              <Button 
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={handleTestVoice}
              >
                <Volume2 className="h-4 w-4" />
                Test voice
              </Button>
              
              <Button 
                className="w-full bg-aura-yellow hover:bg-amber-400 text-black mt-6"
                onClick={handleSave}
              >
                save voice settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>privacy</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleClearHistory}
              >
                clear session history
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleExportData}
              >
                export your data
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleDeleteAccount}
              >
                delete account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
