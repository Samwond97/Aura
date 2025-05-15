
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

const GoalsTracker = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });

  useEffect(() => {
    // Load goals from localStorage
    const storedGoals = localStorage.getItem('goals');
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    } else {
      // Set sample goals if none exist
      const sampleGoals: Goal[] = [
        {
          id: "1",
          title: "Manage Anxiety",
          description: "Learn techniques to better manage my anxiety",
          progress: 40,
          milestones: [
            { id: "1-1", title: "Practice deep breathing daily", completed: true },
            { id: "1-2", title: "Identify triggers", completed: true },
            { id: "1-3", title: "Learn grounding techniques", completed: false },
            { id: "1-4", title: "Reduce caffeine intake", completed: false },
            { id: "1-5", title: "Create anxiety journal", completed: false }
          ],
          createdAt: "2025-04-15",
          updatedAt: "2025-04-30"
        },
        {
          id: "2",
          title: "Improve Sleep",
          description: "Establish better sleep habits",
          progress: 60,
          milestones: [
            { id: "2-1", title: "Consistent sleep schedule", completed: true },
            { id: "2-2", title: "No screens before bed", completed: true },
            { id: "2-3", title: "Bedroom environment optimization", completed: true },
            { id: "2-4", title: "Relaxation routine", completed: false },
            { id: "2-5", title: "Track sleep patterns", completed: false }
          ],
          createdAt: "2025-04-10",
          updatedAt: "2025-04-28"
        }
      ];
      
      setGoals(sampleGoals);
      localStorage.setItem('goals', JSON.stringify(sampleGoals));
    }
  }, []);

  const handleOpenGoal = (goal: Goal) => {
    setCurrentGoal(goal);
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const createNewGoal = () => {
    setCurrentGoal(null);
    setFormData({ title: "", description: "" });
    setIsDialogOpen(true);
  };

  const saveGoal = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    const now = new Date().toISOString();
    const date = now.split('T')[0];

    if (currentGoal) {
      // Update existing goal
      const updatedGoals = goals.map(goal => {
        if (goal.id === currentGoal.id) {
          return {
            ...goal,
            title: formData.title,
            description: formData.description,
            updatedAt: date
          };
        }
        return goal;
      });
      
      setGoals(updatedGoals);
      localStorage.setItem('goals', JSON.stringify(updatedGoals));
      toast.success("Goal updated");
    } else {
      // Create new goal
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        progress: 0,
        milestones: [],
        createdAt: date,
        updatedAt: date
      };
      
      const updatedGoals = [newGoal, ...goals];
      setGoals(updatedGoals);
      localStorage.setItem('goals', JSON.stringify(updatedGoals));
      toast.success("New goal created");
    }
    
    setIsDialogOpen(false);
  };

  const addMilestone = () => {
    if (!currentGoal || !newMilestoneTitle.trim()) return;
    
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title: newMilestoneTitle,
      completed: false
    };
    
    const updatedGoals = goals.map(goal => {
      if (goal.id === currentGoal.id) {
        const updatedMilestones = [...goal.milestones, newMilestone];
        return {
          ...goal,
          milestones: updatedMilestones,
          progress: calculateProgress(updatedMilestones)
        };
      }
      return goal;
    });
    
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
    setNewMilestoneTitle("");
    
    // Update current goal
    const updatedCurrentGoal = updatedGoals.find(g => g.id === currentGoal.id);
    if (updatedCurrentGoal) {
      setCurrentGoal(updatedCurrentGoal);
    }
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(milestone => 
          milestone.id === milestoneId 
            ? { ...milestone, completed: !milestone.completed } 
            : milestone
        );
        
        return {
          ...goal,
          milestones: updatedMilestones,
          progress: calculateProgress(updatedMilestones)
        };
      }
      return goal;
    });
    
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
    
    // Update current goal if open
    if (currentGoal && currentGoal.id === goalId) {
      const updatedCurrentGoal = updatedGoals.find(g => g.id === goalId);
      if (updatedCurrentGoal) {
        setCurrentGoal(updatedCurrentGoal);
      }
    }
  };
  
  const calculateProgress = (milestones: Milestone[]): number => {
    if (milestones.length === 0) return 0;
    const completedCount = milestones.filter(m => m.completed).length;
    return Math.round((completedCount / milestones.length) * 100);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>mental health goals</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </div>
          <Button onClick={createNewGoal} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-1" /> 
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map(goal => (
                <div 
                  key={goal.id} 
                  className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
                  onClick={() => handleOpenGoal(goal)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{goal.title}</h4>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {goal.progress}%
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-2 mb-2" />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(goal.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center bg-muted rounded-md">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">No goals created yet</p>
                <Button onClick={createNewGoal} variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" /> 
                  Create Your First Goal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
            <DialogDescription>
              {currentGoal 
                ? "Update your goal details and manage milestones." 
                : "Set a new mental health goal to track your progress."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                name="title"
                value={currentGoal ? (formData.title || currentGoal.title) : formData.title}
                onChange={handleInputChange}
                placeholder="Enter goal title"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                value={currentGoal ? (formData.description || currentGoal.description) : formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of your goal"
                className="mt-1"
              />
            </div>
            
            {currentGoal && (
              <div className="space-y-2">
                <Label>Milestones</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                  {currentGoal.milestones.map(milestone => (
                    <div 
                      key={milestone.id} 
                      className="flex items-center gap-2 p-1 hover:bg-secondary/20 rounded-md"
                      onClick={() => toggleMilestone(currentGoal.id, milestone.id)}
                    >
                      <CheckCircle 
                        className={`h-4 w-4 cursor-pointer ${
                          milestone.completed ? 'text-green-500' : 'text-gray-300'
                        }`} 
                      />
                      <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                        {milestone.title}
                      </span>
                    </div>
                  ))}
                  {currentGoal.milestones.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No milestones yet
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new milestone"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMilestone();
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={addMilestone}
                    disabled={!newMilestoneTitle.trim()}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveGoal}>
              {currentGoal ? "Update Goal" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoalsTracker;
