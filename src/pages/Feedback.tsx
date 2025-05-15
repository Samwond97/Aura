
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Feedback = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  
  const moods = [
    { emoji: "😍", label: "Love it", color: "bg-gradient-to-br from-pink-400 to-pink-600" },
    { emoji: "😊", label: "Like it", color: "bg-gradient-to-br from-green-400 to-green-600" },
    { emoji: "😐", label: "Neutral", color: "bg-gradient-to-br from-blue-400 to-blue-600" },
    { emoji: "😕", label: "Unsure", color: "bg-gradient-to-br from-yellow-400 to-yellow-600" },
    { emoji: "😔", label: "Disappointed", color: "bg-gradient-to-br from-red-400 to-red-600" },
  ];
  
  const handleSubmit = () => {
    // In a real app, this would send data to an API
    console.log({ selectedMood, feedback });
    toast.success("Thanks for your feedback!");
    
    // Reset form
    setSelectedMood(null);
    setFeedback("");
  };
  
  return (
    <div className="container py-8 max-w-2xl animate-fade-in bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 min-h-screen">
      <h1 className="text-3xl font-medium mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">your feedback</h1>
      
      <Card className="border border-blue-200 dark:border-blue-800 overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
          <CardTitle className="text-blue-800 dark:text-blue-200">how are we doing?</CardTitle>
          <CardDescription>Help us improve your experience</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 p-8">
          <div>
            <Label className="mb-4 block text-lg font-medium">How do you feel about Aura Bloom?</Label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((mood) => (
                <Button
                  key={mood.label}
                  variant={selectedMood === mood.label ? "default" : "outline"}
                  className={`
                    flex flex-col gap-2 p-4 h-auto transition-all duration-300
                    ${selectedMood === mood.label ? `${mood.color} text-white shadow-lg scale-105` : "hover:scale-105"}
                  `}
                  onClick={() => setSelectedMood(mood.label)}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs font-medium">{mood.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="feedback" className="mb-3 block text-lg font-medium">
              Any additional thoughts?
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what's on your mind..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              className="border-blue-200 dark:border-blue-800 focus:ring-blue-500"
            />
          </div>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedMood}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2 shadow-md transition-all duration-300 hover:shadow-lg"
          >
            submit feedback
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Feedback;
