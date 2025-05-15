import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileUp, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';

interface AttachedFile {
  id: string;
  type: 'image' | 'video' | 'pdf' | 'audio';
  url: string;
  file: File;
  position: { x: number, y: number };
  size: { width: number, height: number };
}

interface JournalFileAttachmentProps {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
}

const FileItem: React.FC<{
  file: AttachedFile;
  isActive: boolean;
  onDelete: () => void;
  onResize: (size: { width: number, height: number }) => void;
}> = ({ file, isActive, onDelete, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  
  const handleResize = (increase: boolean) => {
    const scaleFactor = increase ? 1.2 : 0.8;
    const newWidth = Math.max(100, Math.min(800, file.size.width * scaleFactor));
    const newHeight = Math.max(100, Math.min(800, file.size.height * scaleFactor));
    
    onResize({ width: newWidth, height: newHeight });
  };
  
  const renderFileContent = () => {
    switch (file.type) {
      case 'image':
        return (
          <img 
            src={file.url} 
            alt="Attached file" 
            className="w-full h-full object-contain"
          />
        );
      case 'video':
        return (
          <video 
            src={file.url} 
            controls 
            className="w-full h-full object-contain"
          />
        );
      case 'audio':
        return (
          <audio 
            src={file.url} 
            controls 
            className="w-full"
          />
        );
      case 'pdf':
        return (
          <iframe 
            src={file.url} 
            className="w-full h-full" 
            title="PDF preview"
          />
        );
      default:
        return <div>Unsupported file type</div>;
    }
  };
  
  return (
    <div 
      className={`absolute rounded-md overflow-hidden shadow-md border ${isActive ? 'border-blue-500 z-10' : 'border-gray-200'}`}
      style={{
        transform: `translate(${file.position.x}px, ${file.position.y}px)`,
        width: `${file.size.width}px`,
        height: `${file.size.height}px`,
      }}
    >
      <div className="absolute top-2 right-2 flex space-x-1 bg-white bg-opacity-70 rounded p-1 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleResize(true)}
          className="h-6 w-6 p-0 rounded-full"
          title="Increase size"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleResize(false)}
          className="h-6 w-6 p-0 rounded-full"
          title="Decrease size"
        >
          <Minimize2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 rounded-full"
          title="Delete file"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
      {renderFileContent()}
    </div>
  );
};

const JournalFileAttachment: React.FC<JournalFileAttachmentProps> = ({ files, onFilesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileType = file.type.split('/')[0];
    
    // Validate file type
    if (!['image', 'video', 'audio', 'application'].includes(fileType)) {
      toast.error("Unsupported file type");
      return;
    }
    
    // Validate PDF for application type
    if (fileType === 'application' && !file.type.includes('pdf')) {
      toast.error("Only PDF files are supported");
      return;
    }
    
    // Create object URL for the file
    const url = URL.createObjectURL(file);
    
    // Add to attached files
    const newFile: AttachedFile = {
      id: `file-${Date.now()}`,
      type: fileType === 'application' ? 'pdf' : fileType as 'image' | 'video' | 'audio',
      url,
      file,
      position: { x: 0, y: 0 },
      size: { width: 200, height: 200 }
    };
    
    onFilesChange([...files, newFile]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast.success("File attached");
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    
    const { active, delta } = event;
    const fileId = active.id as string;
    
    onFilesChange(
      files.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              position: { 
                x: file.position.x + delta.x, 
                y: file.position.y + delta.y 
              } 
            }
          : file
      )
    );
  };
  
  const handleResizeFile = (fileId: string, newSize: { width: number, height: number }) => {
    onFilesChange(
      files.map(file => 
        file.id === fileId 
          ? { ...file, size: newSize }
          : file
      )
    );
  };
  
  const handleDeleteFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId));
    toast.success("File removed");
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleFileUpload}
        className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors"
        title="Attach file"
      >
        <FileUp className="h-4 w-4 text-slate-600" />
      </Button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        accept="image/*,video/*,audio/*,application/pdf"
      />
      
      <DndContext
        sensors={sensors}
        modifiers={[restrictToParentElement]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="relative w-full min-h-[200px]">
          {files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              isActive={file.id === activeDragId}
              onDelete={() => handleDeleteFile(file.id)}
              onResize={(newSize) => handleResizeFile(file.id, newSize)}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
};

export default JournalFileAttachment; 