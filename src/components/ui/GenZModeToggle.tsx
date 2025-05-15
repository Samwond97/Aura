
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface GenZModeToggleProps {
  className?: string;
  onChange?: (enabled: boolean) => void;
}

const GenZModeToggle = ({ className, onChange }: GenZModeToggleProps) => {
  const [enabled, setEnabled] = useState(localStorage.getItem("genZMode") === "true");

  useEffect(() => {
    // Initialize from localStorage
    const savedValue = localStorage.getItem("genZMode") === "true";
    setEnabled(savedValue);
  }, []);

  const handleChange = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem("genZMode", checked.toString());
    if (onChange) onChange(checked);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Switch 
        id="gen-z-mode" 
        checked={enabled}
        onCheckedChange={handleChange}
      />
      <Label htmlFor="gen-z-mode" className="cursor-pointer">
        gen z mode
      </Label>
    </div>
  );
};

export default GenZModeToggle;
