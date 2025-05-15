import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, PenSquare, BookOpen, Smile, Moon } from "lucide-react";

interface NewEntryButtonProps {
  variant?: "default" | "outline" | "secondary" | "link" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const NewEntryButton: React.FC<NewEntryButtonProps> = ({ 
  variant = "default", 
  size = "default",
  className = ""
}) => {
  const navigate = useNavigate();

  const handleNewEntry = () => {
    navigate('/journal/entry');
  };

  const handleNewEntryWithTemplate = (templateType: string) => {
    navigate(`/journal/entry?template=${templateType}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`bg-purple-600 hover:bg-purple-700 ${className}`}
        >
          <Plus className="mr-2 h-4 w-4" /> New Entry
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3">
        <div className="space-y-2">
          <h3 className="font-medium mb-2">Choose a template</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNewEntry}
            className="w-full justify-start"
          >
            <PenSquare className="mr-2 h-4 w-4 text-gray-500" />
            Blank Entry
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleNewEntryWithTemplate('gratitude')}
            className="w-full justify-start"
          >
            <Smile className="mr-2 h-4 w-4 text-yellow-500" />
            Gratitude Journal
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleNewEntryWithTemplate('dream')}
            className="w-full justify-start"
          >
            <Moon className="mr-2 h-4 w-4 text-blue-500" />
            Dream Journal
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleNewEntryWithTemplate('reflection')}
            className="w-full justify-start"
          >
            <BookOpen className="mr-2 h-4 w-4 text-purple-500" />
            Daily Reflection
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NewEntryButton; 