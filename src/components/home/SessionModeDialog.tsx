
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Video, Mic } from "lucide-react";

interface SessionModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: "text" | "voice" | "video") => void;
}

const SessionModeDialog = ({ isOpen, onClose, onSelectMode }: SessionModeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Conversation Mode</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            variant="outline"
            className="flex items-center justify-start gap-3 h-12"
            onClick={() => onSelectMode("text")}
          >
            <MessageSquare className="h-5 w-5" />
            Text Chat
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center justify-start gap-3 h-12"
            onClick={() => onSelectMode("voice")}
          >
            <Mic className="h-5 w-5" />
            Voice Conversation
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center justify-start gap-3 h-12"
            onClick={() => onSelectMode("video")}
          >
            <Video className="h-5 w-5" />
            Face to Face
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionModeDialog;
