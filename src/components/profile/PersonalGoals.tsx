
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Plus, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Goal {
  id: string;
  title: string;
  progress: number;
  milestones: number;
  milestonesCompleted: number;
  category: "mental health" | "wellness" | "personal growth";
  updatedAt: string;
}

const PersonalGoals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "Manage Anxiety",
      progress: 42,
      milestones: 5,
      milestonesCompleted: 2,
      category: "mental health",
      updatedAt: "UPDATED 01/05/2025"
    },
    {
      id: "2",
      title: "Improve Sleep",
      progress: 80,
      milestones: 4,
      milestonesCompleted: 3,
      category: "wellness",
      updatedAt: "UPDATED 03/05/2025"
    },
    {
      id: "3",
      title: "Daily Gratitude Practice",
      progress: 65,
      milestones: 7,
      milestonesCompleted: 4,
      category: "personal growth",
      updatedAt: "UPDATED 04/05/2025"
    }
  ]);

  const getCategoryLabel = (category: string): string => {
    return category
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "mental health":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "wellness":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "personal growth":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900 overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-blue-700 dark:text-blue-300">mental health goals</CardTitle>
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Track your progress
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-5">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-base">{goal.title}</h4>
                  <Badge variant="outline" className={getCategoryColor(goal.category)}>
                    {getCategoryLabel(goal.category)}
                  </Badge>
                </div>
                <span className="text-sm font-medium">{goal.progress}%</span>
              </div>
              
              <Progress value={goal.progress} className="h-2 mt-2 mb-2" />
              
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{goal.milestonesCompleted} of {goal.milestones} milestones</span>
                <span>{goal.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t border-blue-100 dark:border-blue-900/50 p-4">
        <Button variant="outline" size="sm" className="ml-auto text-blue-600 hover:text-blue-700 border-blue-200 dark:border-blue-800 flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PersonalGoals;
