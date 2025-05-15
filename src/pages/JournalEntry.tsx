import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronDown,
  Mic,
  MicOff,
  FileUp,
  Trash2,
  Maximize2,
  Minimize2,
  FileOutput,
  FileText,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Download,
  Music,
  Image as ImageIcon,
  Film,
  File,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Sparkles
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import ExportDialog from '@/components/ExportDialog';
import { supabase, uploadFile, getFileUrl } from '@/lib/supabase';
import { enhanceJournalEntry } from '@/lib/ai';

// CSS for contentEditable placeholder
const contentEditableStyle = `
  [contenteditable=true]:empty:before {
    content: attr(data-placeholder);
    color: #94a3b8;
    font-style: italic;
  }
`;

type TextAlign = 'left' | 'center' | 'right';

interface JournalEntryProps {}

interface AttachedFile {
  id: string;
  type: 'image' | 'video' | 'pdf' | 'audio';
  url: string;
  file: File;
  fileName: string;  // Store filename separately for persistence
  fileType: string;  // Store mime type separately for persistence
  fileSize: number;  // Store file size separately for persistence
  position: { x: number, y: number };
  size: { width: number, height: number };
  isPlaying?: boolean;
  storagePath?: string;  // Supabase storage path
  publicUrl?: string;    // Supabase public URL
}

const JournalEntry: React.FC<JournalEntryProps> = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  
  // State for the journal entry
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhanceProgress, setEnhanceProgress] = useState<number>(0);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  
  // Voice typing state
  const [isListening, setIsListening] = useState<boolean>(false);
  
  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [showFileControls, setShowFileControls] = useState<string | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);
  const [audioWaveformData, setAudioWaveformData] = useState<{[key: string]: number[]}>({});
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [documentCurrentPage, setDocumentCurrentPage] = useState<number>(1);
  const [documentTotalPages, setDocumentTotalPages] = useState<number>(1);
  const [documentScale, setDocumentScale] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  const videoRefs = useRef<{[key: string]: HTMLVideoElement | null}>({});
  const documentContainerRef = useRef<HTMLDivElement>(null);
  
  // Speech recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({
    commands: [
      {
        command: 'clear',
        callback: () => {
          if (contentEditableRef.current) {
            contentEditableRef.current.innerHTML = '';
            handleContentChange();
          }
        }
      },
      {
        command: 'new line',
        callback: () => {
          if (contentEditableRef.current) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              if (contentEditableRef.current.contains(range.commonAncestorContainer)) {
                const br = document.createElement('br');
                range.insertNode(br);
                range.setStartAfter(br);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                handleContentChange();
              }
            }
          }
        }
      }
    ]
  });
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
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
      // Call the async loadEntry function
      loadEntry(id).catch(error => {
        console.error("Error in loadEntry:", error);
        toast.error("Failed to load entry");
        navigate('/journal');
      });
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
  }, [title, content, isSaving]);

  // Effect for speech recognition transcript updates
  useEffect(() => {
    if (transcript && listening) {
      // Pass the transcript to our handler and reset
      handleTranscription(transcript);
      resetTranscript();
    }
  }, [transcript, listening]);
  
  // Update listening state when SpeechRecognition status changes
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  // Set up media event listeners
  useEffect(() => {
    // Set up time update listeners for audio files
    const audioElements = Object.values(audioRefs.current).filter(Boolean);
    const videoElements = Object.values(videoRefs.current).filter(Boolean);
    
    const handleTimeUpdate = () => {
      // Force a re-render to update the time display
      setAttachedFiles(prev => [...prev]);
    };
    
    audioElements.forEach(audio => {
      if (audio) {
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleTimeUpdate);
      }
    });
    
    videoElements.forEach(video => {
      if (video) {
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleTimeUpdate);
      }
    });
    
    return () => {
      audioElements.forEach(audio => {
        if (audio) {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('loadedmetadata', handleTimeUpdate);
        }
      });
      
      videoElements.forEach(video => {
        if (video) {
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('loadedmetadata', handleTimeUpdate);
        }
      });
    };
  }, [attachedFiles]);
  
  // Force files to stay within container after rendering
  useEffect(() => {
    if (attachedFiles.length === 0) return;
    
    // Force reposition all files after render
    const forceRepositionFiles = () => {
      // This is no longer needed with the new file list display
    };
    
    // Run after render
    const timerId = setTimeout(forceRepositionFiles, 300);
    window.addEventListener('resize', forceRepositionFiles);
    
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', forceRepositionFiles);
    };
  }, [attachedFiles]);

  // Generate audio waveform data from audio file
  const generateWaveform = useCallback(async (audioFile: File, fileId: string) => {
    try {
      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Read file as ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get audio channel data (mono or left channel for stereo)
      const channelData = audioBuffer.getChannelData(0);
      
      // Calculate waveform by sampling audio data
      // We'll take ~100 samples across the entire audio file
      const waveformData: number[] = [];
      const blockSize = Math.floor(channelData.length / 100);
      
      for (let i = 0; i < 100; i++) {
        const startSample = blockSize * i;
        let sum = 0;
        
        // Calculate average amplitude for this block
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[startSample + j] || 0);
        }
        
        // Normalize to a value between 0-1
        const average = sum / blockSize;
        waveformData.push(average);
      }
      
      // Normalize the entire waveform to make it visually appealing
      const maxAmplitude = Math.max(...waveformData);
      const normalizedWaveform = waveformData.map(a => a / maxAmplitude);
      
      // Store in state
      setAudioWaveformData(prev => ({
        ...prev,
        [fileId]: normalizedWaveform
      }));
    } catch (error) {
      console.error('Error generating waveform:', error);
      // Create a fallback random waveform if processing fails
      const fallbackWaveform = Array(100).fill(0).map(() => Math.random());
      setAudioWaveformData(prev => ({
        ...prev,
        [fileId]: fallbackWaveform
      }));
    }
  }, []);
  
  // Process audio files to generate waveforms
  useEffect(() => {
    // Find audio files that don't have waveform data yet
    const audioFilesWithoutWaveforms = attachedFiles.filter(
      file => file.type === 'audio' && !audioWaveformData[file.id]
    );
    
    // Generate waveforms for each file
    audioFilesWithoutWaveforms.forEach(file => {
      generateWaveform(file.file, file.id);
    });
  }, [attachedFiles, audioWaveformData, generateWaveform]);
  
  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    
    // Apply to currently playing audio/video
    if (previewFile) {
      if (previewFile.type === 'audio' && audioRefs.current[previewFile.id]) {
        audioRefs.current[previewFile.id]!.volume = newVolume;
      } else if (previewFile.type === 'video' && videoRefs.current[previewFile.id]) {
        videoRefs.current[previewFile.id]!.volume = newVolume;
      }
    }
  };
  
  // Handle document navigation
  const handleDocumentPageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && documentCurrentPage > 1) {
      setDocumentCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && documentCurrentPage < documentTotalPages) {
      setDocumentCurrentPage(prev => prev + 1);
    }
  };
  
  // Handle document zoom
  const handleDocumentZoom = (zoomDirection: 'in' | 'out') => {
    if (zoomDirection === 'in' && documentScale < 2) {
      setDocumentScale(prev => Math.min(2, prev + 0.1));
    } else if (zoomDirection === 'out' && documentScale > 0.5) {
      setDocumentScale(prev => Math.max(0.5, prev - 0.1));
    }
  };

  // Update the loadEntry function to preserve file metadata
  const loadEntry = async (entryId: string) => {
    try {
      // Load journal entries from localStorage
      const savedEntries = localStorage.getItem('journalEntries');
      if (savedEntries) {
        const entries = JSON.parse(savedEntries);
        const entry = entries.find((e: any) => e.id === entryId);
        
        if (entry) {
          setTitle(entry.title);
          // Use rawContent if available, otherwise use content (for backward compatibility)
          const contentToLoad = entry.rawContent || entry.content || '';
          setContent(contentToLoad);
          if (entry.textAlign) setTextAlign(entry.textAlign as TextAlign);
          if (entry.fontSize) setFontSize(entry.fontSize);
          if (entry.fontFamily) setFontFamily(entry.fontFamily);
          if (entry.date) setSelectedDate(new Date(entry.date));
          
          // Process attached files
          if (entry.attachedFiles && entry.attachedFiles.length > 0) {
            try {
              // Show loading toast
              const toastId = toast.loading("Loading attached files...");
              
            // Map through files and ensure URLs are valid
              const processedFilesPromises = entry.attachedFiles.map(async (file: AttachedFile) => {
              // Create a processed file with all metadata intact
              const processedFile = {
                ...file,
                // Ensure we have the fileName, fileType, and fileSize (for backward compatibility)
                fileName: file.fileName || (file.file ? file.file.name : `${file.type} file`),
                fileType: file.fileType || (file.file ? file.file.type : `${file.type}/*`),
                fileSize: file.fileSize || (file.file ? file.file.size : 0),
              };
              
              // If the file has a storagePath, get a fresh Supabase URL
              if (file.storagePath) {
                  console.log("Loading file from Supabase storage path:", file.storagePath);
                  
                  try {
                    // Get a fresh public URL
                const publicUrl = getFileUrl(file.storagePath);
                processedFile.publicUrl = publicUrl;
                    processedFile.url = publicUrl; // Use the updated Supabase URL
                    
                    // Fetch the file content from the URL
                    const response = await fetch(publicUrl);
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    
                    // Create a file-like object with the blob and metadata
                    // Use blob directly with metadata to avoid File constructor issues
                    processedFile.file = Object.assign(blob, {
                      name: processedFile.fileName,
                      type: processedFile.fileType,
                      lastModified: Date.now()
                    }) as File;
                    
                    console.log("Successfully loaded file:", processedFile.fileName);
                  } catch (error) {
                    console.error(`Error fetching file from Supabase: ${file.storagePath}`, error);
                    toast.error(`Failed to load file: ${processedFile.fileName}`);
                    
                    // Try to use the original URL as fallback
                    if (file.url && file.url !== file.publicUrl) {
                      processedFile.url = file.url;
                    }
                  }
                } else if (file.url) {
                  // For files without storagePath but with url (backward compatibility)
                  try {
                    const response = await fetch(file.url);
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    
                    // Create a file-like object with the blob and metadata
                    // Use blob directly with metadata to avoid File constructor issues
                    processedFile.file = Object.assign(blob, {
                      name: processedFile.fileName,
                      type: processedFile.fileType,
                      lastModified: Date.now()
                    }) as File;
                  } catch (error) {
                    console.error(`Error fetching file from URL: ${file.url}`, error);
                  }
              }
              
              return processedFile;
            });
            
              // Wait for all file processing to complete
              const processedFiles = await Promise.all(processedFilesPromises);
            setAttachedFiles(processedFiles);
              toast.dismiss(toastId);
              toast.success(`Loaded ${processedFiles.length} attached files`);
            } catch (error) {
              console.error("Error processing attached files:", error);
              toast.error("Some files could not be loaded properly");
            }
          } else {
            setAttachedFiles([]);
          }
          
          // Set the content to the editable div after DOM is ready
          setTimeout(() => {
            if (contentEditableRef.current) {
              contentEditableRef.current.innerHTML = contentToLoad;
              handleContentChange();
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
  
  // Direct method to insert transcript text
  const insertTranscriptText = (text: string) => {
    if (!contentEditableRef.current || !text.trim()) return;
    
    // Get selection to determine where to insert text
    const selection = window.getSelection();
    
    try {
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Check if cursor is inside our editable div
        if (contentEditableRef.current.contains(range.commonAncestorContainer)) {
          // Create a text node
          const textNode = document.createTextNode(text);
          
          // Insert at cursor position
          range.insertNode(textNode);
          
          // Move cursor after the inserted text
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Cursor not in editor, append to end
          contentEditableRef.current.appendChild(document.createTextNode(text));
          
          // Set cursor at the end
          const newRange = document.createRange();
          newRange.selectNodeContents(contentEditableRef.current);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // No selection, append to end
        contentEditableRef.current.appendChild(document.createTextNode(text));
        
        // Set cursor at the end
        const newRange = document.createRange();
        newRange.selectNodeContents(contentEditableRef.current);
        newRange.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
      
      // Update state
      handleContentChange();
    } catch (error) {
      console.error("Error inserting text:", error);
      // Fallback method - just append to content
      contentEditableRef.current.innerText += text;
      handleContentChange();
    }
  };
  
  // Speech recognition callback when transcription happens  
  const handleTranscription = (text: string) => {
    if (!text.trim()) return;
    
    // Insert text
    insertTranscriptText(text);
    
    // Focus editor
    contentEditableRef.current?.focus();
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

  // Improve the processContentForSaving function to better preserve formatting
  const processContentForSaving = (htmlContent: string): string => {
    // Create a temporary element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Process headings, paragraphs and other elements to add proper spacing
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }
      
      const element = node as HTMLElement;
      let result = '';
      const nodeName = element.nodeName.toLowerCase();
      
      // Add spacing for block elements and line breaks
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(nodeName)) {
        result += '\n';
      }
      
      // Process children
      Array.from(element.childNodes).forEach(child => {
        result += processNode(child);
      });
      
      // Add extra spacing after certain elements
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote'].includes(nodeName)) {
        result += '\n';
      }
      
      return result;
    };
    
    // Process the entire content
    let processedContent = processNode(tempDiv);
    
    // Remove extra line breaks
    processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
    
    return processedContent.trim();
  };

  // Update the handleSave function to properly save file metadata
  const handleSave = async (shouldNavigateBack: boolean = true) => {
    if (!validateFields()) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    setIsSaving(true);
    
    try {
      // Get current HTML content
      const contentHTML = contentEditableRef.current?.innerHTML || '';
      // Process content to be more readable
      const processedContent = processContentForSaving(contentHTML);
      
      // Show uploading toast for files
      let uploadToastId;
      if (attachedFiles.length > 0) {
        uploadToastId = toast.loading(`Uploading ${attachedFiles.length} files to storage...`);
      }
      
      // Process attached files to ensure they're stored in Supabase
      const processedFiles = await Promise.all(
        attachedFiles.map(async (file, index) => {
          // If the file already has a storagePath, it's already in Supabase
          if (file.storagePath && file.publicUrl) {
            console.log(`File ${index + 1}/${attachedFiles.length} already uploaded:`, file.fileName);
            return file;
          }
          
          // Upload the file to Supabase
          console.log(`Uploading file ${index + 1}/${attachedFiles.length}:`, file.fileName);
          let storagePath = null;
          
          try {
            // Upload the file to storage
            storagePath = await uploadFile(file.file);
            
            if (!storagePath) {
              throw new Error("Failed to get storage path from upload");
            }
            
            // Get the public URL
            const publicUrl = getFileUrl(storagePath);
            
            if (!publicUrl) {
              throw new Error("Failed to get public URL for uploaded file");
            }
            
            console.log(`File ${index + 1} uploaded successfully:`, storagePath);
            
            return {
              ...file,
              storagePath,
              publicUrl,
              url: publicUrl, // Update the URL to use the Supabase URL
              // Ensure metadata is preserved
              fileName: file.fileName || file.file.name,
              fileType: file.fileType || file.file.type,
              fileSize: file.fileSize || file.file.size
            };
          } catch (error) {
            console.error(`Failed to upload file ${index + 1}:`, file.fileName, error);
          
          // If upload fails, return the original file with metadata
          return {
            ...file,
            // Ensure metadata is preserved even if upload fails
            fileName: file.fileName || file.file.name,
            fileType: file.fileType || file.file.type,
            fileSize: file.fileSize || file.file.size
          };
          }
        })
      );
      
      // Clear the uploading toast if it exists
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }
      
      // Count successful uploads
      const successfulUploads = processedFiles.filter(file => file.storagePath).length;
      if (successfulUploads > 0) {
        toast.success(`Successfully uploaded ${successfulUploads} files`);
      }
      
      // Get existing entries
      const savedEntries = localStorage.getItem('journalEntries');
      const entries = savedEntries ? JSON.parse(savedEntries) : [];
      
      // Create new entry object
      const newEntry = {
        id: isEditMode && id ? id : Date.now().toString(),
        date: selectedDate || new Date(),
        title: title,
        content: processedContent, // Save the processed content
        rawContent: contentHTML, // Save raw HTML for editing
        textAlign: textAlign,
        fontSize: fontSize,
        fontFamily: fontFamily,
        attachedFiles: processedFiles,
        tags: [],
        isFavorite: false,
        wordCount,
        charCount,
        createdAt: isEditMode ? undefined : new Date(),
        updatedAt: new Date()
      };
      
      let updatedEntries;
      
      if (isEditMode && id) {
        // Update existing entry
        updatedEntries = entries.map((entry: any) => 
          entry.id === id ? { ...entry, ...newEntry } : entry
        );
      } else {
        // Add new entry
        updatedEntries = [newEntry, ...entries];
      }
      
      // Save to localStorage
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      // Update last saved time
      setLastSaved(new Date());
      setIsSaving(false);
      
      toast.success(isEditMode ? "Journal entry updated" : "Journal entry saved");
      
      if (shouldNavigateBack) {
        navigate('/journal');
      }
      
      return true;
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Unable to save entry. Check your connection and try again.");
      setIsSaving(false);
      return false;
    }
  };
  
  const autoSave = async () => {
    const contentHTML = contentEditableRef.current?.innerHTML || '';
    if (!title.trim() && !contentHTML.trim()) return;
    
    try {
      // Process content to be more readable
      const processedContent = processContentForSaving(contentHTML);
      
      // Ensure file metadata is preserved during autosave
      const processedFiles = attachedFiles.map(file => ({
        ...file,
        // Ensure all necessary metadata is saved
        fileName: file.fileName || (file.file ? file.file.name : `${file.type} file`),
        fileType: file.fileType || (file.file ? file.file.type : `${file.type}/*`),
        fileSize: file.fileSize || (file.file ? file.file.size : 0)
      }));
      
      // Get existing entries
      const savedEntries = localStorage.getItem('journalEntries');
      const entries = savedEntries ? JSON.parse(savedEntries) : [];
      
      // Create new entry object
      const newEntry = {
        id: isEditMode && id ? id : Date.now().toString(),
        date: selectedDate || new Date(),
        title: title,
        content: processedContent, // Save the processed content
        rawContent: contentHTML, // Save raw HTML for editing
        textAlign: textAlign,
        fontSize: fontSize,
        fontFamily: fontFamily,
        attachedFiles: processedFiles,
        tags: [],
        isFavorite: false,
        wordCount,
        charCount,
        createdAt: isEditMode ? undefined : new Date(),
        updatedAt: new Date()
      };
      
      let updatedEntries;
      
      if (isEditMode && id) {
        // Update existing entry
        updatedEntries = entries.map((entry: any) => 
          entry.id === id ? { ...entry, ...newEntry } : entry
        );
      } else {
        // Add new entry
        updatedEntries = [newEntry, ...entries];
      }
      
      // Save to localStorage
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      // Update last saved time
      setLastSaved(new Date());
      
      // Show subtle toast
      toast.success("Auto-saved", {
        duration: 2000,
        style: { opacity: 0.7 }
      });
    } catch (error) {
      console.error("Error auto-saving entry:", error);
    }
  };
  
  const handleClose = () => {
    handleSave(true);
  };

  // Update the handleEnhance function to use the AI API
  const handleEnhance = async () => {
    if (!contentEditableRef.current?.textContent?.trim()) {
      toast.error("Please write some content first");
      return;
    }

    setIsEnhancing(true);
    setEnhanceProgress(0);
    
    // Animation progress timer
    const progressInterval = setInterval(() => {
      setEnhanceProgress(prev => {
        if (prev >= 95) {
          // Don't let it reach 100% until we actually finish
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    
    try {
      // Get current content
      const currentTitle = title;
      const currentContent = contentEditableRef.current?.innerHTML || '';
      
      // Call the AI enhancement API
      toast.info("Enhancing your journal entry with AI...");
      
      // Enhance the content using our AI function
      const enhanced = await enhanceJournalEntry(currentTitle, currentContent);
      
      if (enhanced.error) {
        throw new Error(enhanced.error);
      }
      
      // Complete the progress animation
      clearInterval(progressInterval);
      setEnhanceProgress(100);
      
      // Apply the enhanced content after a short delay to finish the animation
      setTimeout(() => {
        // Update the title and content
        setTitle(enhanced.title);
        
        // Set the enhanced content to the editable div
        if (contentEditableRef.current) {
          contentEditableRef.current.innerHTML = enhanced.content;
          
          // Trigger an input event to update word count
          const event = new Event('input', { bubbles: true });
          contentEditableRef.current.dispatchEvent(event);
        }
        
        setIsEnhancing(false);
        setEnhanceProgress(0);
        toast.success("Your journal entry has been enhanced with AI!");
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error enhancing entry:", error);
      toast.error("AI enhancement failed. Please try again.");
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

  const handleAlignment = (align: TextAlign) => {
    setTextAlign(align);
    formatText('justifyText' + align.charAt(0).toUpperCase() + align.slice(1)); // e.g., 'justifyTextLeft'
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    toast.success(`Date selected: ${date ? format(date, 'PPP') : 'None'}`);
  };

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      // Update word and character count
      const text = contentEditableRef.current.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      
      setWordCount(words);
      setCharCount(chars);
      
      // Clear error if content is not empty
      if (text.trim()) {
        setContentError("");
      }
    }
  };

  // Helper function to get font display name
  const getFontDisplayName = (fontClass: string) => {
    const font = availableFonts.find(f => f.class === fontClass);
    return font ? font.name : 'Default';
  };

  // Function to handle entry deletion
  const handleDelete = () => {
    if (!isEditMode || !id) {
      toast.error("Cannot delete a new entry");
      return;
    }
    
    try {
      // Get existing entries
      const savedEntries = localStorage.getItem('journalEntries');
      if (!savedEntries) {
        toast.error("No journal entries found");
        return;
      }
      
      const entries = JSON.parse(savedEntries);
      const updatedEntries = entries.filter((entry: any) => entry.id !== id);
      
      // Save updated entries
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      toast.success("Journal entry deleted successfully");
      navigate('/journal');
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  // Media playback helpers
  const toggleAudioPlay = (fileId: string) => {
    const audioElement = audioRefs.current[fileId];
    if (!audioElement) return;
    
    if (audioElement.paused) {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && !audio.paused) {
          audio.pause();
        }
      });
      audioElement.play();
      setPlayingFile(fileId);
    } else {
      audioElement.pause();
      setPlayingFile(null);
    }
  };
  
  const toggleVideoPlay = (fileId: string) => {
    const videoElement = videoRefs.current[fileId];
    if (!videoElement) return;
    
    if (videoElement.paused) {
      videoElement.play();
      setPlayingFile(fileId);
    } else {
      videoElement.pause();
      setPlayingFile(null);
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const handleMediaEnded = () => {
    setPlayingFile(null);
  };
  
  const toggleFullscreen = (fileId: string, type: 'image' | 'video') => {
    if (expandedFile === fileId) {
      setExpandedFile(null);
    } else {
      setExpandedFile(fileId);
    }
  };
  
  // File preview handlers
  const handleFileDoubleClick = (file: AttachedFile) => {
    // For PDF files, open in a new tab
    if (file.type === 'pdf') {
      // Use the Supabase public URL if available, otherwise fall back to the original URL
      const fileUrl = file.publicUrl || file.url;
      window.open(fileUrl, '_blank');
    } else {
      // For other file types, use the preview modal
      setPreviewFile(file);
    }
  };
  
  const handleClosePreview = () => {
    setPreviewFile(null);
    setPlayingFile(null);
  };
  
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio':
        return <Music className="h-5 w-5 text-black" />;
      case 'video':
        return <Film className="h-5 w-5 text-gray-700" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-gray-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-gray-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getFileTypeClass = (fileType: string) => {
    switch (fileType) {
      case 'audio':
        return 'file-audio';
      case 'video':
        return 'file-video';
      case 'image':
        return 'file-image';
      case 'pdf':
        return 'file-document';
      default:
        return '';
    }
  };
  
  const handlePreviewPlayPause = () => {
    if (!previewFile) return;
    
    if (previewFile.type === 'audio') {
      const audioElement = audioRefs.current[previewFile.id];
      if (!audioElement) return;
      
      if (audioElement.paused) {
        audioElement.play();
        setPlayingFile(previewFile.id);
      } else {
        audioElement.pause();
        setPlayingFile(null);
      }
    } else if (previewFile.type === 'video') {
      const videoElement = videoRefs.current[previewFile.id];
      if (!videoElement) return;
      
      if (videoElement.paused) {
        videoElement.play();
        setPlayingFile(previewFile.id);
      } else {
        videoElement.pause();
        setPlayingFile(null);
      }
    }
  };

  // Improved file upload handling to ensure proper File objects are created
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    // Process each uploaded file
    const newFiles: AttachedFile[] = Array.from(uploadedFiles).map(file => {
      // Generate a unique ID for the file
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create URL for the file
      const fileUrl = URL.createObjectURL(file);
      
      // Determine file type
      let fileType: 'image' | 'video' | 'pdf' | 'audio' = 'image';
      if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type.startsWith('audio/')) fileType = 'audio';
      
      // Create an AttachedFile object with proper metadata
      const attachedFile: AttachedFile = {
        id: fileId,
        type: fileType,
        url: fileUrl,
        file: file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        isPlaying: false
      };
      
      // Generate waveform data for audio files
      if (fileType === 'audio') {
        generateWaveform(file, fileId);
      }
      
      return attachedFile;
    });
    
    // Add new files to the state
    setAttachedFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF7ED] text-slate-800 py-10 px-6">
      <style>{`
        [contenteditable=true]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
        }
        
        /* Media Player Styles */
        .audio-container {
          background: linear-gradient(to right, #f0f9ff, #e6f7ff);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 12px;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .audio-container:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }
        
        .audio-wave {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 32px;
          margin-top: 12px;
        }
        
        .audio-wave .wave-bar {
          width: 3px;
          height: 100%;
          background-color: rgba(59, 130, 246, 0.5);
          border-radius: 2px;
          transition: height 0.2s ease;
        }
        
        .audio-wave.playing .wave-bar {
          animation: sound 1.2s linear infinite alternate;
        }
        
        .audio-wave.playing .wave-bar:nth-child(1) { animation-delay: 0.0s; }
        .audio-wave.playing .wave-bar:nth-child(2) { animation-delay: 0.2s; }
        .audio-wave.playing .wave-bar:nth-child(3) { animation-delay: 0.4s; }
        .audio-wave.playing .wave-bar:nth-child(4) { animation-delay: 0.3s; }
        .audio-wave.playing .wave-bar:nth-child(5) { animation-delay: 0.1s; }
        .audio-wave.playing .wave-bar:nth-child(6) { animation-delay: 0.5s; }
        .audio-wave.playing .wave-bar:nth-child(7) { animation-delay: 0.2s; }
        .audio-wave.playing .wave-bar:nth-child(8) { animation-delay: 0.6s; }
        .audio-wave.playing .wave-bar:nth-child(9) { animation-delay: 0.3s; }
        .audio-wave.playing .wave-bar:nth-child(10) { animation-delay: 0.4s; }
        
        @keyframes sound {
          0% {
            height: 8px;
          }
          100% {
            height: 28px;
          }
        }
        
        .video-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .video-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
        
        .video-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .video-container:hover .video-overlay {
          opacity: 1;
        }
        
        .image-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }
        
        .image-container:hover {
          transform: scale(1.02);
        }
        
        .document-container {
          background: linear-gradient(135deg, #f9f9f9, #f0f0f0);
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        .document-container:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }
        
        /* Media Controls */
        .media-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .video-container:hover .media-controls,
        .media-controls.visible {
          opacity: 1;
        }
        
        /* File actions */
        .file-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 18px;
          padding: 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .file-actions.visible,
        .file-item:hover .file-actions {
          opacity: 1;
        }
        
        /* New File List Styles */
        .file-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          padding: 8px;
        }
        
        .file-list-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.3s ease;
          cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          position: relative;
        }
        
        .file-list-item:hover {
          transform: translateY(-1px);
        }
        
        .file-list-item .file-icon {
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .file-list-item .file-name {
          flex: 1;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: calc(100% - 80px);
        }
        
        /* File type specific styles */
        .file-audio {
          background-color: #F2F2F2;
          border: 1px solid #000;
        }
        
        .file-audio:hover {
          background-color: #E5E5E5;
        }
        
        .file-video {
          background-color: #ECECEC;
          border: 1px solid #4A4A4A;
        }
        
        .file-video:hover {
          background-color: #E0E0E0;
        }
        
        .file-image {
          background-color: #EDEDED;
          border: 1px solid #CCCCCC;
        }
        
        .file-image:hover {
          background-color: #E3E3E3;
        }
        
        .file-document {
          background-color: #EFEFEF;
          border: 1px solid #AAAAAA;
        }
        
        .file-document:hover {
          background-color: #E6E6E6;
        }
        
        /* Preview Modal */
        .preview-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        
        .preview-modal-content {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 20px;
          max-width: 90vw;
          max-height: 90vh;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          position: relative;
        }
        
        /* Audio waveform in preview */
        .preview-audio-container {
          width: 600px;
          max-width: 90vw;
          padding: 20px;
        }
        
        .preview-audio-wave {
          height: 60px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 2px;
          margin: 20px 0;
          background-color: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
          padding: 10px;
        }
        
        .preview-audio-wave .wave-bar {
          width: 3px;
          background-color: #000;
          border-radius: 2px;
        }
        
        .preview-audio-wave.playing .wave-bar {
          animation: previewSound 0.8s ease infinite alternate;
        }
        
        @keyframes previewSound {
          0% {
            height: 10px;
          }
          100% {
            height: 40px;
          }
        }
        
        /* Video preview */
        .preview-video-container {
          width: 800px;
          max-width: 90vw;
        }
        
        /* Image preview */
        .preview-image-container {
          width: 800px;
          max-width: 90vw;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .preview-image-container img {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
        }
        
        /* Document preview */
        .preview-document-container {
          width: 800px;
          height: 80vh;
          max-width: 90vw;
        }
        
        /* Preview controls */
        .preview-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
        }
        
        .preview-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
        }
        
        /* Volume slider container - positioned relative to the button */
        .volume-slider-container {
          position: absolute;
          right: 0;
          bottom: calc(100% + 8px);
          width: 32px;
          height: 120px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 10px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 50;
        }
        
        .volume-slider-container .slider-wrapper {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .volume-slider-container .slider {
          height: 100%;
          width: 4px;
          background-color: #e5e5e5;
          border-radius: 2px;
          position: relative;
        }
        
        .volume-slider-container .slider-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #000;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          cursor: pointer;
        }
      `}</style>
      
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
              <div className="flex-1 relative">
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
                  data-placeholder="Start writing your thoughts..."
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                {contentError && (
                  <p className="text-red-500 text-xs mt-1">{contentError}</p>
                )}
                
                {/* Voice recording indicator */}
                {listening && (
                  <div className="absolute bottom-4 right-4 bg-red-50 px-4 py-2 rounded-full flex items-center shadow-md z-10 border border-red-200 animate-pulse">
                    <Mic className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-red-500">Recording voice...</span>
                  </div>
                )}
                
                {/* Live transcription preview */}
                {listening && (
                  <div className="absolute bottom-16 right-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-md z-10 border-2 border-blue-300 max-h-40 overflow-y-auto">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                      <p className="text-sm font-bold text-blue-800">Voice Recognition Active</p>
                    </div>
                    
                    <div className="mb-2 text-xs text-gray-500">
                      {transcript ? "Currently hearing:" : "Waiting for speech..."}
                    </div>
                    
                    {transcript ? (
                      <p className="text-md text-blue-700 break-words whitespace-pre-wrap border-l-2 border-blue-300 pl-3 py-1 font-medium">
                        {transcript}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400">
                        Try speaking clearly into your microphone...
                      </p>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded mr-2">Tip:</span>
                      Say "new line" for paragraph breaks or "clear" to reset
                    </div>
                  </div>
                )}
              </div>
              
              {/* Attached Files Display */}
              {attachedFiles.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-700">Attached Files</h3>
                    <span className="text-xs text-slate-500">{attachedFiles.length} {attachedFiles.length === 1 ? 'File' : 'Files'} Attached</span>
                  </div>
                  <div className="relative w-full border border-slate-300 rounded-lg">
                    <div className="file-list attached-files-container">
                      {attachedFiles.map(file => (
                        <div 
                          key={file.id}
                          className={`file-list-item ${getFileTypeClass(file.type)}`}
                          onDoubleClick={() => handleFileDoubleClick(file)}
                        >
                          <div className="file-icon">
                            {getFileTypeIcon(file.type)}
                          </div>
                          <div className="file-name">
                            {file.file.name}
                          </div>
                          <div className="flex space-x-1">
                            {file.type === 'audio' && (
                            <Button
                              variant="ghost"
                              size="sm"
                                onClick={() => toggleAudioPlay(file.id)}
                              className="h-6 w-6 p-0 rounded-full"
                            >
                                {playingFile === file.id 
                                  ? <Pause className="h-3 w-3" /> 
                                  : <Play className="h-3 w-3" />
                                }
                            </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAttachedFiles(files => files.filter(f => f.id !== file.id));
                                toast.success("File removed");
                              }}
                              className="h-6 w-6 p-0 rounded-full hover:bg-red-50"
                              title="Delete file"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          
                          {/* Hidden audio elements for playback */}
                          {file.type === 'audio' && (
                            <audio 
                              ref={el => audioRefs.current[file.id] = el} 
                              src={file.url} 
                              onEnded={handleMediaEnded}
                              className="hidden"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
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
                {/* Left side buttons group */}
                <div className="flex items-center space-x-3">
                  {/* Enhance button (star icon) */}
                  <Button
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    variant="ghost"
                    className="text-purple-500 hover:text-purple-600 transition-all p-2 hover:scale-110 hover:shadow-md rounded-full group"
                    title="Enhance entry with AI"
                  >
                    {isEnhancing ? (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-8 w-8 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-200 transition-all duration-300" 
                              style={{ width: `${enhanceProgress}%` }}
                            />
                          </div>
                        </div>
                        <Sparkles className="h-8 w-8 text-purple-500 relative z-10 animate-pulse" />
                      </div>
                    ) : (
                      <Sparkles className="h-8 w-8 fill-current transition-opacity group-hover:opacity-80" />
                    )}
                  </Button>
                  
                  {/* Voice typing button */}
                  <Button
                    onClick={() => {
                      if (!browserSupportsSpeechRecognition) {
                        toast.error("Your browser doesn't support speech recognition");
                        return;
                      }
                      
                      if (listening) {
                        // Stop listening
                        SpeechRecognition.stopListening();
                        setIsListening(false);
                        toast.success("Voice recording stopped");
                      } else {
                        // Focus the content area first to ensure cursor is positioned
                        if (contentEditableRef.current) {
                          contentEditableRef.current.focus();
                          
                          // If no selection, set cursor at end
                          const selection = window.getSelection();
                          if (!selection || selection.rangeCount === 0) {
                            const range = document.createRange();
                            range.selectNodeContents(contentEditableRef.current);
                            range.collapse(false); // collapse to end
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }
                        }
                        
                        // Start listening with options for best results
                        SpeechRecognition.startListening({ 
                          continuous: true,
                          interimResults: true,
                          language: 'en-US'
                        });
                        
                        setIsListening(true);
                        toast.info("Listening... Speak clearly");
                      }
                    }}
                    disabled={isEnhancing}
                    variant={listening ? "destructive" : "ghost"}
                    className={`p-2 hover:scale-110 hover:shadow-md rounded-full group transition-all ${
                      listening 
                        ? "bg-red-100 text-red-500 animate-pulse"
                        : "text-[#4285F4] hover:text-[#3367D6]"
                    }`}
                    title={listening ? "Stop voice recording" : "Start voice recording"}
                  >
                    {listening ? (
                      <MicOff className="h-8 w-8 transition-opacity group-hover:opacity-80" />
                    ) : (
                      <Mic className="h-8 w-8 transition-opacity group-hover:opacity-80" />
                    )}
                  </Button>
                  
                  {/* File upload button */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isEnhancing}
                    variant="ghost"
                    className="text-[#4285F4] hover:text-[#3367D6] transition-all p-2 hover:scale-110 hover:shadow-md rounded-full group"
                    title="Attach file"
                  >
                    <FileUp className="h-8 w-8 transition-opacity group-hover:opacity-80" />
                  </Button>
                  
                  {/* Delete button - only show for existing entries */}
                  {isEditMode && (
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isEnhancing}
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 transition-all p-2 hover:scale-110 hover:shadow-md rounded-full group"
                      title="Delete entry"
                    >
                      <Trash2 className="h-8 w-8 transition-opacity group-hover:opacity-80" />
                    </Button>
                  )}
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,audio/*,application/pdf"
                    aria-label="File upload"
                    onChange={handleFileUpload}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Export button */}
                  <Button 
                    onClick={() => setShowExportDialog(true)}
                    disabled={isSaving}
                    variant="outline"
                    className="text-gray-700 hover:bg-gray-100 border-gray-300 transition-all hover:shadow-sm flex items-center gap-2"
                  >
                    <FileOutput className="h-4 w-4" />
                    Export
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
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Add the Delete Confirmation Dialog at the end of the component */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your journal entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title={title}
        contentRef={contentEditableRef}
      />

      {/* PDF Preview Dialog */}
      {pdfPreviewUrl && (
        <AlertDialog open={!!pdfPreviewUrl} onOpenChange={() => setPdfPreviewUrl(null)}>
          <AlertDialogContent className="max-w-3xl h-[80vh]">
            <AlertDialogHeader>
              <AlertDialogTitle>PDF Preview</AlertDialogTitle>
              <AlertDialogCancel asChild>
                <Button variant="ghost" size="sm" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="h-5 w-5 text-slate-600" />
                </Button>
              </AlertDialogCancel>
            </AlertDialogHeader>
            <div className="h-full py-4">
              <iframe 
                src={pdfPreviewUrl} 
                className="w-full h-full border-0" 
                title="PDF preview"
              />
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* File Preview Modal */}
      {previewFile && (previewFile.type === 'audio' || previewFile.type === 'video' || previewFile.type === 'image') && (
        <div className="preview-modal-overlay" onClick={handleClosePreview}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="preview-close"
              onClick={handleClosePreview}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Audio Preview */}
            {previewFile.type === 'audio' && (
              <div className="preview-audio-container">
                <h3 className="text-lg font-medium mb-4">{previewFile.file.name}</h3>
                
                <div className={`preview-audio-wave ${playingFile === previewFile.id ? 'playing' : ''}`}>
                  {[...Array(30)].map((_, index) => (
                    <div 
                      key={index} 
                      className="wave-bar" 
                      style={{ 
                        height: `${Math.max(5, Math.random() * 20 + 5)}px`,
                      }}
                    />
                  ))}
                </div>
                
                <audio 
                  ref={el => audioRefs.current[previewFile.id] = el} 
                  src={previewFile.url}
                  onEnded={handleMediaEnded}
                  className="hidden"
                />
                
                <div className="preview-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewPlayPause}
                    className="flex items-center gap-2"
                  >
                    {playingFile === previewFile.id 
                      ? <><Pause className="h-4 w-4" /> Pause</>
                      : <><Play className="h-4 w-4" /> Play</>
                    }
                  </Button>
                  
                  <span className="text-sm text-slate-500">
                    {audioRefs.current[previewFile.id]?.currentTime 
                      ? formatTime(audioRefs.current[previewFile.id]?.currentTime || 0)
                      : '0:00'
                    } / {audioRefs.current[previewFile.id]?.duration 
                      ? formatTime(audioRefs.current[previewFile.id]?.duration || 0)
                      : '0:00'
                    }
                  </span>
                  
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                    >
                      {volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {showVolumeSlider && (
                      <div className="volume-slider-container">
                        <div className="slider-wrapper">
                          <div className="slider">
                            <div 
                              className="slider-thumb" 
                              style={{ bottom: `${volume * 100}%` }}
                              onMouseDown={(e) => {
                                const sliderEl = e.currentTarget.parentElement;
                                if (!sliderEl) return;
                                
                                const handleDrag = (moveEvent: MouseEvent) => {
                                  const rect = sliderEl.getBoundingClientRect();
                                  const height = rect.height;
                                  const y = moveEvent.clientY - rect.top;
                                  
                                  // Calculate volume (inverted, as 0 is bottom of slider)
                                  let newVolume = 1 - Math.max(0, Math.min(1, y / height));
                                  
                                  handleVolumeChange(newVolume);
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleDrag);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleDrag);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-xs mt-1">{Math.round(volume * 100)}%</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Video Preview */}
            {previewFile.type === 'video' && (
              <div className="preview-video-container flex flex-col items-center">
                <h3 className="text-lg font-medium mb-4">{previewFile.file.name}</h3>
                
                <div className="video-wrapper relative flex items-center justify-center w-full">
                  <video
                    ref={el => {
                      videoRefs.current[previewFile.id] = el;
                      if (el) {
                        el.volume = volume;
                        
                        // Handle aspect ratio on load
                        el.onloadedmetadata = () => {
                          const aspectRatio = el.videoWidth / el.videoHeight;
                          if (aspectRatio > 1) {
                            // Landscape video
                            el.style.width = "100%";
                            el.style.height = "auto";
                          } else {
                            // Portrait or square video
                            el.style.height = "60vh";
                            el.style.width = "auto";
                          }
                        };
                      }
                    }}
                    src={previewFile.url}
                    className="max-w-full object-contain rounded-lg shadow-lg"
                    poster={previewFile.url + '#t=0.1'} // Try to get thumbnail
                    controls
                    onEnded={handleMediaEnded}
                  />
                </div>
              </div>
            )}
            
            {/* Image Preview */}
            {previewFile.type === 'image' && (
              <div className="preview-image-container">
                <h3 className="text-lg font-medium mb-4">{previewFile.file.name}</h3>
                <img 
                  src={previewFile.url} 
                  alt={previewFile.file.name} 
                  className="rounded-lg"
                />
                <div className="preview-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ZoomIn className="h-4 w-4" />
                    Zoom
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = previewFile.url;
                      a.download = previewFile.file.name;
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Dialog */}
      {expandedFile && attachedFiles.find(f => f.id === expandedFile && f.type === 'image') && (
        <AlertDialog open={true} onOpenChange={() => setExpandedFile(null)}>
          <AlertDialogContent className="max-w-5xl h-[90vh] p-4 bg-black/90">
            <AlertDialogCancel asChild>
              <Button variant="ghost" size="sm" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full text-white hover:bg-white/20 transition-colors z-50">
                <X className="h-5 w-5" />
              </Button>
            </AlertDialogCancel>
            <div className="h-full w-full flex items-center justify-center">
              <img 
                src={attachedFiles.find(f => f.id === expandedFile)?.url} 
                alt="Fullscreen preview" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-sm">
              {attachedFiles.find(f => f.id === expandedFile)?.file.name}
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Fullscreen Video Dialog */}
      {expandedFile && attachedFiles.find(f => f.id === expandedFile && f.type === 'video') && (
        <AlertDialog open={true} onOpenChange={() => setExpandedFile(null)}>
          <AlertDialogContent className="max-w-5xl h-[90vh] p-4 bg-black/90">
            <AlertDialogCancel asChild>
              <Button variant="ghost" size="sm" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full text-white hover:bg-white/20 transition-colors z-50">
                <X className="h-5 w-5" />
              </Button>
            </AlertDialogCancel>
            <div className="h-full w-full flex items-center justify-center">
              <video 
                src={attachedFiles.find(f => f.id === expandedFile)?.url}
                className="max-h-full max-w-full"
                controls
                autoPlay
              />
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default JournalEntry; 