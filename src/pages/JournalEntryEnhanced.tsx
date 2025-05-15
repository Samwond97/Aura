import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Star, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Calendar,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JournalVoiceTyping from "@/components/JournalVoiceTyping";
import JournalFileAttachment from "@/components/JournalFileAttachment";

interface AttachedFile {
  id: string;
  type: 'image' | 'video' | 'pdf' | 'audio';
  url: string;
  file: File;
  position: { x: number, y: number };
  size: { width: number, height: number };
}

interface JournalEntryProps {}

const JournalEntry: React.FC<JournalEntryProps> = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  
  // State for the journal entry
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhanceProgress, setEnhanceProgress] = useState<number>(0);
  const [textAlign, setTextAlign] = useState<string>('left');
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<string>('Times New Roman');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [titleError, setTitleError] = useState<string>('');
  const [contentError, setContentError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFontSizeSlider, setShowFontSizeSlider] = useState<boolean>(false);
  
  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  
  // Available fonts
  const availableFonts = [
    { name: "Times New Roman", class: "font-times" },
    { name: "Arial", class: "font-sans" },
    { name: "Georgia", class: "font-serif" },
    { name: "Courier New", class: "font-mono" },
    { name: "Verdana", class: "font-sans" },
    { name: "Tahoma", class: "font-sans" },
    { name: "Trebuchet MS", class: "font-sans" }
  ];
  
  // Font size presets
  const fontSizePresets = [
    { name: "Small", size: 14 },
    { name: "Medium", size: 16 },
    { name: "Large", size: 18 },
    { name: "Extra Large", size: 24 }
  ];
  
  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // References
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Hide sidebar when component mounts
  useEffect(() => {
    // Hide sidebar by adding a class to the body
    document.body.classList.add('hide-sidebar');
    
    // Clean up when component unmounts
    return () => {
      document.body.classList.remove('hide-sidebar');
    };
  }, []);

  // Effect to load data if editing
  useEffect(() => {
    if (isEditMode && id) {
      loadEntry(id);
    }
  }, [id]);
  
  // Effect to update word and character count
  useEffect(() => {
    if (contentEditableRef.current) {
      const text = contentEditableRef.current.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      
      setWordCount(words);
      setCharCount(chars);
    }
  }, [content]);
  
  // Effect to handle auto-save
  useEffect(() => {
    // Set up auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      if (contentEditableRef.current && (title.trim() || contentEditableRef.current.innerHTML.trim()) && !isSaving) {
        autoSave();
      }
    }, 10000); // Auto-save every 10 seconds
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, isSaving, attachedFiles]);

  const loadEntry = (entryId: string) => {
    try {
      // Load journal entries from localStorage
      const savedEntries = localStorage.getItem('journalEntries');
      if (savedEntries) {
        const entries = JSON.parse(savedEntries);
        const entry = entries.find((e: any) => e.id === entryId);
        
        if (entry) {
          setTitle(entry.title);
          setContent(entry.content || '');
          if (entry.textAlign) setTextAlign(entry.textAlign);
          if (entry.fontSize) setFontSize(entry.fontSize);
          if (entry.fontFamily) setFontFamily(entry.fontFamily);
          if (entry.date) setSelectedDate(new Date(entry.date));
          if (entry.attachedFiles) setAttachedFiles(entry.attachedFiles);
          
          // Set the content to the editable div after DOM is ready
          setTimeout(() => {
            if (contentEditableRef.current && entry.content) {
              contentEditableRef.current.innerHTML = entry.content;
            }
          }, 100);
        } else {
          toast.error("Entry not found");
          navigate('/journal');
        }
      }
    } catch (error) {
      console.error("Error loading entry:", error);
      toast.error("Error loading entry");
      navigate('/journal');
    }
  };
  
  const validateFields = () => {
    let isValid = true;
    
    // Validate title
    if (!title.trim()) {
      setTitleError("Title cannot be empty");
      isValid = false;
    } else {
      setTitleError("");
    }
    
    // Validate content
    const contentText = contentEditableRef.current?.innerHTML || '';
    if (!contentText.trim()) {
      setContentError("Content cannot be empty");
      isValid = false;
    } else {
      setContentError("");
    }
    
    return isValid;
  };

  const handleSave = (shouldNavigateBack: boolean = true) => {
    if (!validateFields()) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    setIsSaving(true);
    
    try {
      // Get current HTML content
      const contentHTML = contentEditableRef.current?.innerHTML || '';
      
      // Get existing entries
      const savedEntries = localStorage.getItem('journalEntries');
      const entries = savedEntries ? JSON.parse(savedEntries) : [];
      
      // Create new entry object
      const newEntry = {
        id: isEditMode && id ? id : Date.now().toString(),
        date: selectedDate || new Date(),
        title: title,
        content: contentHTML,
        textAlign: textAlign,
        fontSize: fontSize,
        fontFamily: fontFamily,
        attachedFiles: attachedFiles,
        tags: [],
        isFavorite: false,
        lastModified: new Date()
      };
      
      let updatedEntries = [];
      
      if (isEditMode && id) {
        // Update existing entry
        updatedEntries = entries.map((entry: any) => 
          entry.id === id ? newEntry : entry
        );
      } else {
        // Add new entry
        updatedEntries = [newEntry, ...entries];
      }
      
      // Save to localStorage
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      // Update state
      setLastSaved(new Date());
      setIsSaving(false);
      
      toast.success(`Journal entry ${isEditMode ? 'updated' : 'saved'} successfully!`);
      
      // Navigate back to journal list if requested
      if (shouldNavigateBack) {
        navigate('/journal');
      }
      
      return true;
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Error saving entry");
      setIsSaving(false);
      return false;
    }
  };
  
  const autoSave = () => {
    if (contentEditableRef.current && (title.trim() || contentEditableRef.current.innerHTML.trim())) {
      handleSave(false);
    }
  };
  
  const handleClose = () => {
    navigate('/journal');
  };
  
  const handleEnhance = async () => {
    if (isEnhancing) {
      return;
    }

    setIsEnhancing(true);
    setEnhanceProgress(0);
    
    // Animation progress timer
    const progressInterval = setInterval(() => {
      setEnhanceProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    try {
      // Here we would normally call an AI service API
      // For this demo, we'll simulate an AI enhancement with a timeout
      
      setTimeout(() => {
        clearInterval(progressInterval);
        setEnhanceProgress(100);
        
        // Get current content
        const currentContent = contentEditableRef.current?.innerHTML || '';
        
        // Simulate AI enhanced content
        const enhancedTitle = title ? 
          `${title} - Refined` : 
          `Thoughts on ${format(new Date(), 'MMMM d, yyyy')}`;
        
        const enhancedContent = `<h1 style="font-size: 1.5em; margin-bottom: 0.5em;">${enhancedTitle}</h1><p>${currentContent}</p><h2 style="font-size: 1.25em; margin-top: 1em; margin-bottom: 0.5em;">Reflections</h2><p>As I look back on what I've written, I realize these thoughts reveal important patterns in my life. The experiences I've captured here are valuable stepping stones in my personal journey.</p><p>Taking time to write has helped me gain clarity and perspective. Through this process of reflection, I've come to understand myself a little better today.</p>`;

        setTimeout(() => {
          setTitle(enhancedTitle);
          if (contentEditableRef.current) {
            contentEditableRef.current.innerHTML = enhancedContent;
            // Trigger an input event to update word count
            const event = new Event('input', { bubbles: true });
            contentEditableRef.current.dispatchEvent(event);
          }
          setIsEnhancing(false);
          setEnhanceProgress(0);
          toast.success("Your entry has been enhanced!");
        }, 500);
        
      }, 2000);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error enhancing entry:", error);
      toast.error("Enhancement failed. Please try again.");
      setIsEnhancing(false);
      setEnhanceProgress(0);
    }
  };

  // Handle formatting commands
  const formatText = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    
    // Focus back on the content
    if (contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    if (contentEditableRef.current) {
      // Check if text is selected
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().trim() !== '') {
        // Format only selected text
        formatText('fontSize', size / 16 + ''); // Convert to traditional HTML font size
      } else {
        // Apply to entire div if no selection
        contentEditableRef.current.style.fontSize = `${size}px`;
      }
    }
  };

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    if (contentEditableRef.current) {
      // Check if text is selected
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().trim() !== '') {
        // Format only selected text
        formatText('fontName', font);
      } else {
        // Apply to entire div if no selection
        contentEditableRef.current.style.fontFamily = font;
      }
    }
  };

  const handleAlignment = (align: string) => {
    setTextAlign(align);
    formatText('justify' + align.charAt(0).toUpperCase() + align.slice(1)); // e.g., 'justifyLeft'
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    toast.success(`Date selected: ${date ? format(date, 'PPP') : 'None'}`);
  };

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      setContent(contentEditableRef.current.innerHTML);
      
      // Update word and character count
      const text = contentEditableRef.current.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      
      setWordCount(words);
      setCharCount(chars);
      
      if (contentEditableRef.current.innerHTML.trim()) {
        setContentError("");
      }
    }
  };
  
  // Helper function to get font display name
  const getFontDisplayName = (fontClass: string) => {
    const font = availableFonts.find(f => f.class === fontClass);
    return font ? font.name : 'Default';
  };
  
  // Handle voice typing transcript
  const handleTranscript = (transcript: string) => {
    if (contentEditableRef.current) {
      // Get selection to insert at current cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (contentEditableRef.current.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          range.insertNode(document.createTextNode(transcript));
          
          // Move cursor to end of inserted text
          range.setStartAfter(range.endContainer);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Update content
          handleContentChange();
        }
      } else {
        // If no selection, append to end
        contentEditableRef.current.innerText += transcript;
        handleContentChange();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF7ED] text-slate-800 py-10 px-6">
      {/* Main content container */}
      <div className="container max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        {/* Main journal container */}
        <Card className="border-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-white rounded-[24px] overflow-hidden animate-fade-in relative">
          {/* Close button */}
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-slate-100 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </Button>
          
          <CardContent className="p-8">
            <div className="flex-1 flex flex-col space-y-6">
              {/* Title input */}
              <div>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError("");
                  }}
                  placeholder="Enter your title..."
                  className={`text-3xl font-semibold border-none bg-transparent placeholder:text-slate-400 text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0 font-times p-0 ${titleError ? 'border-red-500' : ''}`}
                  style={{ fontFamily: fontFamily }}
                />
                {titleError && (
                  <p className="text-red-500 text-xs mt-1">{titleError}</p>
                )}
              </div>
              
              {/* Formatting toolbar */}
              <div className="flex items-center space-x-3 py-2 border-b border-slate-200 flex-wrap">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => formatText('bold')}
                  className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors"
                  title="Bold"
                >
                  <Bold className="h-4 w-4 text-slate-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => formatText('italic')}
                  className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors"
                  title="Italic"
                >
                  <Italic className="h-4 w-4 text-slate-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => formatText('underline')}
                  className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors"
                  title="Underline"
                >
                  <Underline className="h-4 w-4 text-slate-600" />
                </Button>
                <div className="w-px h-5 bg-slate-200" />
                
                {/* Font Size Dropdown */}
                <Popover open={showFontSizeSlider} onOpenChange={setShowFontSizeSlider}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 rounded-md hover:bg-slate-100 transition-colors flex items-center space-x-1"
                      title="Font Size"
                    >
                      <Type className="h-4 w-4 text-slate-600" />
                      <span className="text-xs">{fontSize}px</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Text Size</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">Small</span>
                        <Slider 
                          value={[fontSize]} 
                          min={12} 
                          max={36} 
                          step={1}
                          onValueChange={(values) => handleFontSizeChange(values[0])}
                          className="flex-1"
                        />
                        <span className="text-xs">Large</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {fontSizePresets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleFontSizeChange(preset.size);
                              setShowFontSizeSlider(false);
                            }}
                            className={`text-xs ${fontSize === preset.size ? 'bg-slate-100' : ''}`}
                          >
                            {preset.name} ({preset.size}px)
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Font Family Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 rounded-md hover:bg-slate-100 transition-colors flex items-center space-x-1"
                      title="Font Family"
                    >
                      <span className="text-xs font-bold text-slate-600">A</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {availableFonts.map((font) => (
                      <DropdownMenuItem
                        key={font.class}
                        onClick={() => handleFontFamilyChange(font.name)}
                        className="cursor-pointer"
                      >
                        <span style={{ fontFamily: font.name }}>{font.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="w-px h-5 bg-slate-200" />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAlignment('left')}
                  className={`h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors ${textAlign === 'left' ? 'bg-slate-100' : ''}`}
                  title="Align Left"
                >
                  <AlignLeft className="h-4 w-4 text-slate-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAlignment('center')}
                  className={`h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors ${textAlign === 'center' ? 'bg-slate-100' : ''}`}
                  title="Align Center"
                >
                  <AlignCenter className="h-4 w-4 text-slate-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAlignment('right')}
                  className={`h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors ${textAlign === 'right' ? 'bg-slate-100' : ''}`}
                  title="Align Right"
                >
                  <AlignRight className="h-4 w-4 text-slate-600" />
                </Button>
                
                <div className="w-px h-5 bg-slate-200" />
                
                {/* Voice typing button */}
                <JournalVoiceTyping onTranscriptChange={handleTranscript} />
                
                {/* File attachment button */}
                <JournalFileAttachment 
                  files={attachedFiles}
                  onFilesChange={setAttachedFiles}
                />
                
                <div className="w-px h-5 bg-slate-200" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 transition-colors"
                      title="Date Selection"
                    >
                      <Calendar className="h-4 w-4 text-slate-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Content area - Rich Text Editor */}
              <div className="relative flex-1">
                <div
                  ref={contentEditableRef}
                  contentEditable
                  className={`w-full min-h-[40vh] outline-none p-0 text-slate-700 ${contentError ? 'border-red-500' : ''}`}
                  style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    textAlign: textAlign
                  }}
                  onInput={handleContentChange}
                  placeholder="Start writing your thoughts..."
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                {contentError && (
                  <p className="text-red-500 text-xs mt-1">{contentError}</p>
                )}
                
                {/* Attached files container appears below the content */}
                {attachedFiles.length > 0 && (
                  <div className="attached-files-container mt-4 relative">
                    <h4 className="text-sm font-medium mb-2">Attached Files</h4>
                    <div className="relative min-h-[200px] border border-dashed border-slate-200 rounded-md p-2">
                      {/* Files will be positioned absolutely within this container by the JournalFileAttachment component */}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Word count and last saved info */}
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <div>
                  {wordCount} words · {charCount} characters
                </div>
                <div>
                  {selectedDate && (
                    <span className="mr-3">{format(selectedDate, 'PPP')}</span>
                  )}
                  {lastSaved && (
                    <span>Last saved: {format(lastSaved, 'p')}</span>
                  )}
                </div>
              </div>
              
              {/* Bottom buttons */}
              <div className="flex justify-between items-center pt-4">
                {/* Enhance button (star icon) */}
                <Button
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  variant="ghost"
                  className="text-[#4285F4] hover:text-[#3367D6] transition-all p-2 hover:scale-110 hover:shadow-md rounded-full group"
                >
                  {isEnhancing ? (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-200 transition-all duration-300" 
                            style={{ width: `${enhanceProgress}%` }}
                          />
                        </div>
                      </div>
                      <Star className="h-8 w-8 text-[#4285F4] fill-current animate-pulse relative z-10" />
                    </div>
                  ) : (
                    <Star className="h-8 w-8 fill-current transition-opacity group-hover:opacity-80" />
                  )}
                </Button>
                
                {/* Save button */}
                <Button 
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold rounded-full px-10 py-6 transition-all hover:shadow-md font-serif text-lg relative overflow-hidden"
                >
                  {isSaving ? (
                    <>
                      <span className="opacity-0">Save</span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </span>
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JournalEntry; 