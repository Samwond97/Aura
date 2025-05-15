import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Book, Plus, Calendar as CalendarIcon, Search, PenSquare, Tag, X, ListIcon, 
  LayoutGrid, Filter, SortAsc, SortDesc, Clock, Download, Upload, Trash2, 
  Edit, Star, BookOpen, Smile, Frown, BarChart, Moon, Fingerprint,
  FileOutput, Image as ImageIcon, Video, Film, Music, FileText, File as FileIcon,
  Maximize, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay, parseISO, isToday, isYesterday, subDays } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import ExportDialog from '@/components/ExportDialog';
import { supabase, getFileUrl } from '@/lib/supabase';
import { AlertDialog, AlertDialogContent, AlertDialogCancel, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { enhanceJournalEntry } from '@/lib/ai';

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  tags: string[];
  mood?: string | number;
  isFavorite?: boolean;
  wordCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  rawContent?: string;
  isAIEnhanced?: boolean; // Add this field to track AI enhanced entries
  attachedFiles?: {
    id: string;
    file: File;
    type: string;
    url: string;
    fileName?: string;    // Optional for backward compatibility
    fileType?: string;    // Optional for backward compatibility
    fileSize?: number;    // Optional for backward compatibility
    position: { x: number, y: number };
    size: { width: number, height: number };
    storagePath?: string;  // Supabase storage path
    publicUrl?: string;    // Supabase public URL
  }[];
}

const moodOptions = [
  { value: "1", label: "Very Negative 😔", color: "bg-red-500" },
  { value: "2", label: "Negative 🙁", color: "bg-orange-500" },
  { value: "3", label: "Neutral 😐", color: "bg-yellow-500" },
  { value: "4", label: "Positive 🙂", color: "bg-green-400" },
  { value: "5", label: "Very Positive 😄", color: "bg-green-600" }
];

const Journal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"entries" | "list" | "calendar" | "stats">("list");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [showViewEntryDialog, setShowViewEntryDialog] = useState(false);
  const [showEditEntryDialog, setShowEditEntryDialog] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterMood, setFilterMood] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "longest" | "shortest">("newest");
  
  // New entry form state
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryTags, setNewEntryTags] = useState<string[]>([]);
  const [newEntryMood, setNewEntryMood] = useState<string>('3');
  const [newEntryIsFavorite, setNewEntryIsFavorite] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Edit entry state
  const [editEntryTitle, setEditEntryTitle] = useState('');
  const [editEntryContent, setEditEntryContent] = useState('');
  const [editEntryTags, setEditEntryTags] = useState<string[]>([]);
  const [editEntryMood, setEditEntryMood] = useState<string>('3');
  const [editEntryIsFavorite, setEditEntryIsFavorite] = useState(false);
  const [editTagInput, setEditTagInput] = useState('');
  
  // Stats state
  const [wordCountData, setWordCountData] = useState<Array<{date: string, count: number}>>([]);
  const [moodData, setMoodData] = useState<Array<{date: string, mood: number}>>([]);
  const [entriesPerWeekday, setEntriesPerWeekday] = useState<Record<string, number>>({});
  const [allTags, setAllTags] = useState<Record<string, number>>({});
  
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [entryToExport, setEntryToExport] = useState<JournalEntry | null>(null);
  const entryContentRef = useRef<HTMLDivElement | null>(null);
  
  // Add state for selected media
  const [selectedImage, setSelectedImage] = useState<{ url: string, name: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string, name: string } | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<{ url: string, name: string } | null>(null);
  
  // Add state for tracking AI enhancement
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhanceProgress, setEnhanceProgress] = useState<number>(0);
  
  useEffect(() => {
    // Load journal entries from localStorage
    const loadEntries = () => {
      try {
        const savedEntries = localStorage.getItem('journalEntries');
        if (savedEntries) {
          console.log("Loading journal entries from localStorage");
          
          // Parse entries and ensure dates are properly converted back to Date objects
          const parsedEntries: JournalEntry[] = JSON.parse(savedEntries).map((entry: any) => {
            console.log(`Processing entry ${entry.id}: ${entry.title}`);
            
            // Log file attachments if any
            if (entry.attachedFiles && entry.attachedFiles.length > 0) {
              console.log(`Entry has ${entry.attachedFiles.length} attached files:`, 
                entry.attachedFiles.map(f => ({
                  id: f.id,
                  type: f.type,
                  url: f.url?.substring(0, 30) + '...',
                  publicUrl: f.publicUrl?.substring(0, 30) + '...',
                  storagePath: f.storagePath,
                  fileName: f.fileName || (f.file?.name || 'unknown'),
                  hasFile: !!f.file
                }))
              );
            }
            
            return {
              ...entry,
              date: new Date(entry.date),
              createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.date),
              updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(entry.date),
              wordCount: entry.wordCount || entry.content.split(/\s+/).filter(Boolean).length,
              isFavorite: entry.isFavorite || false,
              rawContent: entry.rawContent || entry.content
            };
          });
          
          setJournalEntries(parsedEntries);
          calculateStats(parsedEntries);
        } else {
          // Generate sample data if no entries exist
          generateSampleEntries();
        }
      } catch (error) {
        console.error("Error loading journal entries:", error);
        generateSampleEntries();
      }
    };
    
    loadEntries();
  }, []);
  
  const calculateStats = (entries: JournalEntry[]) => {
    // Calculate word count over time
    const wordCounts = entries.reduce((acc: Record<string, number>, entry) => {
      const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
      acc[dateStr] = (acc[dateStr] || 0) + (entry.wordCount || 0);
      return acc;
    }, {});
    
    const wordCountArray = Object.entries(wordCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days
    
    // Calculate mood over time
    const moods = entries.reduce((acc: Record<string, number[]>, entry) => {
      if (entry.mood) {
        const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
        acc[dateStr] = [...(acc[dateStr] || []), Number(entry.mood)];
      }
      return acc;
    }, {});
    
    const moodArray = Object.entries(moods).map(([date, moods]) => ({
      date,
      mood: moods.reduce((sum, m) => sum + m, 0) / moods.length // Average mood
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    
    // Calculate entries per weekday
    const weekdays = entries.reduce((acc: Record<string, number>, entry) => {
      const weekday = format(new Date(entry.date), 'EEE');
      acc[weekday] = (acc[weekday] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate tag frequencies
    const tags = entries.reduce((acc: Record<string, number>, entry) => {
      entry.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {});
    
    setWordCountData(wordCountArray);
    setMoodData(moodArray);
    setEntriesPerWeekday(weekdays);
    setAllTags(tags);
  };
  
  const generateSampleEntries = () => {
    const today = new Date();
    
    const sampleEntries: JournalEntry[] = [
      {
        id: '1',
        date: subDays(today, 2),
        title: 'First reflection on my progress',
        content: 'Today I realized I have been making significant progress in managing my stress levels. The meditation techniques I learned have been very helpful.',
        tags: ['reflection', 'progress', 'meditation'],
        mood: '4',
        isFavorite: true,
        wordCount: 24,
        createdAt: subDays(today, 2),
        updatedAt: subDays(today, 2),
        rawContent: 'Today I realized I have been making significant progress in managing my stress levels. The meditation techniques I learned have been very helpful.'
      },
      {
        id: '2',
        date: subDays(today, 1),
        title: 'Challenging day at work',
        content: 'Had a difficult meeting today, but I was able to use the breathing exercises to stay calm and focused.',
        tags: ['work', 'stress', 'coping'],
        mood: '3',
        isFavorite: false,
        wordCount: 19,
        createdAt: subDays(today, 1),
        updatedAt: subDays(today, 1),
        rawContent: 'Had a difficult meeting today, but I was able to use the breathing exercises to stay calm and focused.'
      },
      {
        id: '3',
        date: today,
        title: 'New goals for the month',
        content: 'Setting up my goals for this month. I want to focus on mindfulness, regular exercise, and better sleep habits.',
        tags: ['goals', 'planning', 'mindfulness'],
        mood: '5',
        isFavorite: false,
        wordCount: 21,
        createdAt: today,
        updatedAt: today,
        rawContent: 'Setting up my goals for this month. I want to focus on mindfulness, regular exercise, and better sleep habits.'
      }
    ];
    
    setJournalEntries(sampleEntries);
    localStorage.setItem('journalEntries', JSON.stringify(sampleEntries));
    calculateStats(sampleEntries);
  };
  
  const saveEntries = (entries: JournalEntry[]) => {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    setJournalEntries(entries);
    calculateStats(entries);
  };
  
  const handleCreateEntry = () => {
    if (!newEntryTitle || !newEntryContent) {
      toast.error("Please provide both a title and content for your journal entry");
      return;
    }
    
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: selectedDate || new Date(),
      title: newEntryTitle,
      content: newEntryContent,
      tags: newEntryTags,
      mood: newEntryMood,
      isFavorite: newEntryIsFavorite,
      wordCount: newEntryContent.split(/\s+/).filter(Boolean).length,
      createdAt: new Date(),
      updatedAt: new Date(),
      rawContent: newEntryContent
    };
    
    const updatedEntries = [...journalEntries, newEntry];
    saveEntries(updatedEntries);
    
    setShowNewEntryDialog(false);
    resetNewEntryForm();
    toast.success("Journal entry created successfully");
  };
  
  const handleUpdateEntry = () => {
    if (!selectedEntry || !editEntryTitle || !editEntryContent) {
      toast.error("Please provide both a title and content for your journal entry");
      return;
    }
    
    const updatedEntry: JournalEntry = {
      ...selectedEntry,
      title: editEntryTitle,
      content: editEntryContent,
      tags: editEntryTags,
      mood: editEntryMood,
      isFavorite: editEntryIsFavorite,
      wordCount: editEntryContent.split(/\s+/).filter(Boolean).length,
      updatedAt: new Date(),
      rawContent: editEntryContent
    };
    
    const updatedEntries = journalEntries.map((entry) => 
      entry.id === selectedEntry.id ? updatedEntry : entry
    );
    
    saveEntries(updatedEntries);
    setShowEditEntryDialog(false);
    setSelectedEntry(updatedEntry);
    toast.success("Journal entry updated successfully");
  };
  
  const handleDeleteEntry = () => {
    if (!selectedEntry) return;
    
    const updatedEntries = journalEntries.filter((entry) => 
      entry.id !== selectedEntry.id
    );
    
    saveEntries(updatedEntries);
    setShowConfirmDeleteDialog(false);
    setShowViewEntryDialog(false);
    setSelectedEntry(null);
    toast.success("Journal entry deleted successfully");
  };
  
  const handleToggleFavorite = (entry: JournalEntry) => {
    const updatedEntry = { 
      ...entry, 
      isFavorite: !entry.isFavorite 
    };
    
    const updatedEntries = journalEntries.map((e) => 
      e.id === entry.id ? updatedEntry : e
    );
    
    saveEntries(updatedEntries);
    
    if (selectedEntry && selectedEntry.id === entry.id) {
      setSelectedEntry(updatedEntry);
    }
    
    toast.success(updatedEntry.isFavorite 
      ? "Entry added to favorites" 
      : "Entry removed from favorites"
    );
  };
  
  const resetNewEntryForm = () => {
    setNewEntryTitle('');
    setNewEntryContent('');
    setNewEntryTags([]);
    setNewEntryMood('3');
    setNewEntryIsFavorite(false);
    setNewTagInput('');
  };
  
  const initializeEditForm = (entry: JournalEntry) => {
    setEditEntryTitle(entry.title);
    setEditEntryContent(entry.content);
    setEditEntryTags([...entry.tags]);
    setEditEntryMood(entry.mood?.toString() || '3');
    setEditEntryIsFavorite(entry.isFavorite || false);
    setEditTagInput('');
  };
  
  const handleAddTag = (isEdit: boolean = false) => {
    const tag = isEdit ? editTagInput : newTagInput;
    const currentTags = isEdit ? editEntryTags : newEntryTags;
    
    if (tag && !currentTags.includes(tag)) {
      if (isEdit) {
        setEditEntryTags([...currentTags, tag]);
        setEditTagInput('');
      } else {
        setNewEntryTags([...currentTags, tag]);
        setNewTagInput('');
      }
    }
  };
  
  const handleRemoveTag = (tagToRemove: string, isEdit: boolean = false, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (isEdit) {
      setEditEntryTags(editEntryTags.filter(tag => tag !== tagToRemove));
    } else {
      setNewEntryTags(newEntryTags.filter(tag => tag !== tagToRemove));
    }
  };
  
  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowViewEntryDialog(true);
  };
  
  const handleEditEntry = () => {
    if (!selectedEntry) return;
    
    initializeEditForm(selectedEntry);
    setShowViewEntryDialog(false);
    setShowEditEntryDialog(true);
  };
  
  const exportJournalData = () => {
    try {
      const jsonData = JSON.stringify(journalEntries, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Journal data exported successfully");
    } catch (error) {
      console.error("Error exporting journal data:", error);
      toast.error("Error exporting journal data");
    }
  };
  
  const importJournalData = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          // Validate the imported data
          if (!Array.isArray(importedData)) {
            throw new Error("Invalid data format");
          }
          
          // Convert date strings to Date objects
          const processedData = importedData.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
            createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.date),
            updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(entry.date),
            wordCount: entry.wordCount || entry.content.split(/\s+/).filter(Boolean).length,
            isFavorite: entry.isFavorite || false,
            rawContent: entry.rawContent || entry.content
          }));
          
          saveEntries(processedData);
          toast.success(`${processedData.length} journal entries imported successfully`);
        } catch (error) {
          console.error("Error parsing imported data:", error);
          toast.error("Invalid journal data format");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing journal data:", error);
      toast.error("Error importing journal data");
    }
    
    // Clear the input value to allow importing the same file again
    event.target.value = '';
  };
  
  const getMoodEmoji = (mood?: string | number) => {
    const moodNumber = typeof mood === 'string' ? parseInt(mood, 10) : mood;
    switch (moodNumber) {
      case 1: return "😔";
      case 2: return "🙁";
      case 3: return "😐";
      case 4: return "🙂";
      case 5: return "😄";
      default: return "😐";
    }
  };
  
  const getMoodColor = (mood?: string | number) => {
    const moodNumber = typeof mood === 'string' ? parseInt(mood, 10) : mood;
    switch (moodNumber) {
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      case 4: return "bg-green-400";
      case 5: return "bg-green-600";
      default: return "bg-yellow-500";
    }
  };
  
  // Sort and filter entries
  const processedEntries = journalEntries
    .filter(entry => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query) ||
          entry.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Filter by selected date in calendar view
      if (activeTab === "calendar" && selectedDate) {
        return isSameDay(entry.date, selectedDate);
      }
      
      // Filter by tag
      if (filterTag && !entry.tags.includes(filterTag)) {
        return false;
      }
      
      // Filter by mood
      if (filterMood && entry.mood?.toString() !== filterMood) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest": 
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest": 
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "longest": 
          return (b.wordCount || 0) - (a.wordCount || 0);
        case "shortest": 
          return (a.wordCount || 0) - (b.wordCount || 0);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  
  // Entries with dates that have journal entries (for calendar highlight)
  const entryDates = journalEntries.map(entry => entry.date);
  
  // Create a custom modifier for days with entries
  const hasEntryModifier = {
    hasEntry: (date: Date) => 
      entryDates.some(entryDate => isSameDay(entryDate, date))
  };
  
  const formatEntryDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };
  
  // Get popular tags
  const popularTags = Object.entries(allTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);
  
  // Count entries by mood
  const moodCounts = journalEntries.reduce((acc: Record<string, number>, entry) => {
    const mood = entry.mood?.toString() || "3";
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  // Handle navigating to new entry page
  const handleNewEntry = () => {
    navigate('/journal/entry');
  };

  // Handle navigating to edit entry page
  const handleEditEntryPage = (entryId: string) => {
    navigate(`/journal/entry/${entryId}`);
  };

  // Handle navigating to new entry with template
  const handleNewEntryWithTemplate = (templateType: string) => {
    navigate(`/journal/entry?template=${templateType}`);
  };

  // Add a dropdown or buttons for template selection
  const renderTemplateOptions = () => {
    return (
      <div className="mt-2 grid grid-cols-1 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleNewEntryWithTemplate('gratitude')}
          className="justify-start"
        >
          <Smile className="mr-2 h-4 w-4 text-yellow-500" />
          Gratitude Journal
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleNewEntryWithTemplate('dream')}
          className="justify-start"
        >
          <Moon className="mr-2 h-4 w-4 text-blue-500" />
          Dream Journal
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleNewEntryWithTemplate('reflection')}
          className="justify-start"
        >
          <BookOpen className="mr-2 h-4 w-4 text-purple-500" />
          Daily Reflection
        </Button>
      </div>
    );
  };

  const handleExportEntry = (entry: JournalEntry, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Set the entry to export 
    setEntryToExport(entry);
    
    // Need to update the DOM before showing dialog
    setTimeout(() => {
      setShowExportDialog(true);
    }, 0);
  };
  
  const handleEntryDelete = (entry: JournalEntry, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedEntry(entry);
    setShowConfirmDeleteDialog(true);
  };

  // Update the handleViewAttachedFile function to use file metadata
  const handleViewAttachedFile = (file: any, fileUrl: string) => {
    // Log detailed information about the file for debugging
    console.log("Viewing attached file:", {
      id: file.id,
      type: file.type,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      url: fileUrl?.substring(0, 50) + '...',
      publicUrl: file.publicUrl?.substring(0, 50) + '...',
      storagePath: file.storagePath
    });
    
    if (!fileUrl) {
      toast.error("Error: File URL not available");
      return;
    }
    
    // Normalize file type
    let fileType = file.type;
    
    // Handle when file.type is an object type indicator rather than a MIME type
    if (!fileType.includes('/') && ['image', 'video', 'audio', 'pdf'].includes(fileType)) {
      // Type is already normalized (e.g. 'image', 'video', etc.)
      console.log("Using pre-normalized type:", fileType);
    } else if (fileType.includes('/')) {
      // Type is a MIME type (e.g. 'image/jpeg', 'video/mp4')
      console.log("Normalizing from MIME type:", fileType);
      fileType = fileType.split('/')[0];
    } else {
      // Try to determine type from URL extension
      const extension = fileUrl.split('.').pop()?.toLowerCase();
      console.log("Trying to determine type from extension:", extension);
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        fileType = 'image';
      } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
        fileType = 'video';
      } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
        fileType = 'audio';
      } else if (extension === 'pdf') {
        fileType = 'pdf';
      }
    }
    
    console.log("Final normalized file type:", fileType);
    
    // Get filename from metadata or fallback
    const fileName = file.fileName || file.file?.name || `${file.type} file`;
    
    // Add file preview using correct type
    if (fileType === 'pdf' || fileUrl.toLowerCase().endsWith('.pdf')) {
      console.log("Opening PDF in new tab:", fileUrl);
      window.open(fileUrl, '_blank');
    } else if (fileType === 'image') {
      console.log("Setting image preview:", fileName);
      setSelectedImage({
        url: fileUrl,
        name: fileName
      });
    } else if (fileType === 'video') {
      console.log("Setting video preview:", fileName);
      setSelectedVideo({
        url: fileUrl,
        name: fileName
      });
    } else if (fileType === 'audio') {
      console.log("Setting audio preview:", fileName);
      setSelectedAudio({
        url: fileUrl,
        name: fileName
      });
    } else {
      console.log("Unknown file type, opening in new tab:", fileType);
      window.open(fileUrl, '_blank');
    }
  };

  // Add useEffect to preload file URLs from Supabase
  useEffect(() => {
    // Function to preload and cache file URLs
    const preloadFileUrls = () => {
      // Check for entries with attached files that use Supabase storage
      const entriesToProcess = journalEntries.filter(entry => 
        entry.attachedFiles && 
        entry.attachedFiles.length > 0 &&
        entry.attachedFiles.some(file => file.storagePath)
      );
      
      if (entriesToProcess.length === 0) {
        console.log("No entries found with Supabase-stored files");
        return;
      }
      
      console.log(`Found ${entriesToProcess.length} entries with Supabase files to preload`);
      
      // Process each entry to ensure file URLs are fresh
      entriesToProcess.forEach(entry => {
        if (!entry.attachedFiles) return;
        
        console.log(`Preloading ${entry.attachedFiles.length} files for entry: ${entry.title}`);
        
        // Update file URLs in place
        entry.attachedFiles.forEach(file => {
          if (file.storagePath) {
            const freshUrl = getFileUrl(file.storagePath);
            if (freshUrl && (!file.publicUrl || file.publicUrl !== freshUrl)) {
              console.log(`Updated URL for file ${file.fileName || file.id}:`, 
                freshUrl.substring(0, 50) + '...');
              file.publicUrl = freshUrl;
              
              // Also update the url property for backward compatibility
              file.url = freshUrl;
              
              // Preload image files
              if (file.type === 'image') {
                const img = new Image();
                img.src = freshUrl;
              }
            }
          }
        });
      });
    };
    
    // Run preload when journal entries are loaded
    if (journalEntries.length > 0) {
      preloadFileUrls();
    }
  }, [journalEntries]);

  // Add a function to handle AI enhancement of a journal entry
  const handleEnhanceEntry = async (entry: JournalEntry) => {
    if (!entry || !entry.content) {
      toast.error("No content to enhance");
      return;
    }
    
    setIsEnhancing(true);
    
    // Show toast and progress
    toast.info("Enhancing your journal entry with AI...", {
      duration: 5000
    });
    
    try {
      // Call the AI enhancement API
      const enhanced = await enhanceJournalEntry(entry.title, entry.content);
      
      if (enhanced.error) {
        throw new Error(enhanced.error);
      }
      
      // Update the entry with enhanced content
      const updatedEntry: JournalEntry = {
        ...entry,
        title: enhanced.title,
        content: enhanced.content,
        rawContent: enhanced.content, // Also update raw content for editing
        isAIEnhanced: true, // Mark this entry as AI enhanced
        updatedAt: new Date()
      };
      
      // Update in the state and localStorage
      const updatedEntries = journalEntries.map(e => 
        e.id === entry.id ? updatedEntry : e
      );
      
      saveEntries(updatedEntries);
      
      // Update the selected entry if it's currently being viewed
      if (selectedEntry && selectedEntry.id === entry.id) {
        setSelectedEntry(updatedEntry);
      }
      
      setIsEnhancing(false);
      toast.success("Journal entry enhanced with AI!");
    } catch (error) {
      console.error("Error enhancing entry:", error);
      toast.error("AI enhancement failed. Please try again.");
      setIsEnhancing(false);
    }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium flex items-center gap-3">
          <Book className="h-8 w-8 text-purple-600" />
          <span>Journal</span>
          <span className="text-sm font-normal text-slate-500 ml-4 hidden md:inline-flex items-center">
            <FileOutput className="h-3.5 w-3.5 mr-1 text-blue-500" />
            Export entries as PNG, HTML or PDF
          </span>
        </h1>
        
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search journal entries"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h3 className="font-medium">Filter Entries</h3>
                
                <div className="space-y-2">
                  <Label>By Tag</Label>
                  <Select value={filterTag} onValueChange={setFilterTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Tags</SelectItem>
                      {popularTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>By Mood</Label>
                  <Select value={filterMood} onValueChange={setFilterMood}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Moods</SelectItem>
                      {moodOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${option.color}`} />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">
                        <div className="flex items-center gap-2">
                          <SortDesc className="h-3 w-3" />
                          <span>Newest First</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="oldest">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-3 w-3" />
                          <span>Oldest First</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="longest">
                        <div className="flex items-center gap-2">
                          <SortDesc className="h-3 w-3" />
                          <span>Longest First</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="shortest">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-3 w-3" />
                          <span>Shortest First</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilterTag("");
                      setFilterMood("");
                      setSortBy("newest");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon" onClick={exportJournalData} title="Export Journal">
              <Download className="h-4 w-4" />
            </Button>
            <label htmlFor="import-journal" className="cursor-pointer">
              <input 
                id="import-journal"
                type="file" 
                accept=".json"
                className="hidden"
                onChange={importJournalData}
                aria-label="Import journal data"
              />
              <div className="h-10 w-10 bg-background border rounded-md flex items-center justify-center hover:bg-accent transition-colors">
                <Upload className="h-4 w-4" />
              </div>
            </label>
          </div>
          
          <Button 
            onClick={handleNewEntry}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="list" className="flex-1">
              <ListIcon className="h-4 w-4 mr-2" /> List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1">
              <CalendarIcon className="h-4 w-4 mr-2" /> Calendar View
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">
              <BarChart className="h-4 w-4 mr-2" /> Stats
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mt-6">
          <TabsContent value="list" className="m-0">
            <div className="grid grid-cols-1 gap-4">
              {processedEntries.length > 0 ? (
                processedEntries.map((entry) => (
                  <Card 
                    key={entry.id}
                    className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${entry.isFavorite ? 'border-l-amber-400' : 'border-l-transparent'}`}
                    onClick={() => handleViewEntry(entry)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div 
                            className={`w-3 h-3 rounded-full mt-2 ${getMoodColor(entry.mood)}`} 
                            title={`Mood: ${moodOptions.find(m => m.value === entry.mood?.toString())?.label}`}
                          ></div>
                          <div>
                            <CardTitle className="text-xl">{entry.title}</CardTitle>
                            <CardDescription>
                              {formatEntryDate(entry.date)} • {entry.wordCount} words
                              {entry.isAIEnhanced && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  AI Enhanced
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.isFavorite && (
                            <Star className="h-4 w-4 text-amber-400" />
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={(e) => handleExportEntry(entry, e)}
                            title="Export entry"
                          >
                            <FileOutput className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleEntryDelete(entry, e)}
                            title="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-muted-foreground line-clamp-2 whitespace-pre-line">
                        {entry.content}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs dark:bg-purple-900/30 dark:text-purple-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No journal entries found</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleNewEntry}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create your first entry
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Select a Date</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiersClassNames={{
                      selected: "bg-purple-700 text-white hover:bg-purple-800",
                      hasEntry: "bg-purple-100 text-purple-900 font-medium hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-200"
                    }}
                    modifiers={{
                      selected: selectedDate ? [selectedDate] : [],
                      ...hasEntryModifier
                    }}
                    modifiersStyles={{
                      today: {
                        fontWeight: 'bold',
                        textDecoration: 'underline'
                      }
                    }}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
                    </span>
                    {selectedDate && (
                      <Button
                        size="sm"
                        onClick={handleNewEntry}
                        className="h-8"
                      >
                        <Plus className="mr-1 h-3 w-3" /> New
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <>
                      {processedEntries.length > 0 ? (
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-4">
                            {processedEntries.map(entry => (
                              <div 
                                key={entry.id}
                                className={`p-3 border rounded-md hover:bg-secondary/50 cursor-pointer ${entry.isFavorite ? 'border-l-4 border-l-amber-400' : ''}`}
                                onClick={() => handleViewEntry(entry)}
                              >
                                <div className="flex justify-between items-center">
                                  <h3 className="font-medium">{entry.title}</h3>
                                  <div className="flex items-center gap-2">
                                    {entry.isFavorite && <Star className="h-3 w-3 text-amber-500" />}
                                    <span className={`w-2 h-2 rounded-full ${getMoodColor(entry.mood)}`}></span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 whitespace-pre-line">
                                  {entry.content}
                                </p>
                                {entry.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {entry.tags.map(tag => (
                                      <span 
                                        key={tag} 
                                        className="text-xs bg-secondary px-1.5 py-0.5 rounded-sm"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-center py-12 text-center">
                          <p className="text-muted-foreground mb-4">No entries for this date</p>
                          <Button
                            variant="outline"
                            onClick={handleNewEntry}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Create an entry
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Please select a date</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Word Count Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Word Count Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {wordCountData.length > 1 ? (
                    <ChartContainer className="h-[200px]" config={{ words: {}, date: {} }}>
                      <LineChart data={wordCountData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="Words"
                          stroke="#8884d8" 
                          activeDot={{ r: 6 }} 
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border rounded shadow text-xs">
                                  <p>{format(parseISO(payload[0].payload.date), 'MMM dd, yyyy')}</p>
                                  <p><b>{payload[0].value}</b> words</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-muted-foreground text-center">
                        Not enough data to display chart.<br />
                        Add more journal entries over time.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Mood Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smile className="h-4 w-4 text-yellow-500" />
                    Mood Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {moodData.length > 1 ? (
                    <ChartContainer className="h-[200px]" config={{ mood: {}, date: {} }}>
                      <LineChart data={moodData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
                        <Line 
                          type="monotone" 
                          dataKey="mood" 
                          stroke="#ff7300" 
                          activeDot={{ r: 6 }} 
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const moodValue = payload[0].value as number;
                              const moodText = moodOptions.find(m => parseInt(m.value) === moodValue)?.label || 'Unknown';
                              return (
                                <div className="bg-white p-2 border rounded shadow text-xs">
                                  <p>{format(parseISO(payload[0].payload.date), 'MMM dd, yyyy')}</p>
                                  <p><b>{moodText}</b></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-muted-foreground text-center">
                        Not enough data to display mood chart.<br />
                        Add more journal entries over time.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Entry Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListIcon className="h-4 w-4 text-purple-500" />
                    Journal Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Entries</p>
                        <p className="text-2xl font-semibold">{journalEntries.length}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Words</p>
                        <p className="text-2xl font-semibold">
                          {journalEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0)}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Avg. Words/Entry</p>
                        <p className="text-2xl font-semibold">
                          {journalEntries.length 
                            ? Math.round(journalEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0) / journalEntries.length)
                            : 0}
                        </p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Favorite Entries</p>
                        <p className="text-2xl font-semibold">
                          {journalEntries.filter(entry => entry.isFavorite).length}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Popular Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {popularTags.slice(0, 8).map(tag => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterTag(tag);
                              setActiveTab("list");
                            }}
                          >
                            {tag} ({allTags[tag]})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Mood Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smile className="h-4 w-4 text-pink-500" />
                    Mood Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {moodOptions.map(option => (
                      <div key={option.value} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{option.label}</span>
                          <span>{moodCounts[option.value] || 0}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${option.color}`}
                            style={{ 
                              width: `${journalEntries.length 
                                ? (moodCounts[option.value] || 0) / journalEntries.length * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Weekly Activity</h3>
                    <div className="flex items-end justify-between h-20">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                        const count = entriesPerWeekday[day] || 0;
                        const maxCount = Math.max(...Object.values(entriesPerWeekday));
                        const height = maxCount ? (count / maxCount) * 100 : 0;
                        
                        return (
                          <div key={day} className="flex flex-col items-center">
                            <div 
                              className="w-6 bg-purple-500/80 dark:bg-purple-600 rounded-t"
                              style={{ height: `${height}%` }}
                            ></div>
                            <span className="text-xs mt-1">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* New Entry Dialog */}
      <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
            <DialogDescription>
              Record your thoughts, feelings, and experiences
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="favorite" className="text-xs text-muted-foreground">Favorite</Label>
                  <Switch 
                    id="favorite"
                    checked={newEntryIsFavorite}
                    onCheckedChange={setNewEntryIsFavorite}
                  />
                </div>
              </div>
              <Input
                id="title"
                value={newEntryTitle}
                onChange={(e) => setNewEntryTitle(e.target.value)}
                placeholder="Give your entry a title"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="content"
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                placeholder="Write your thoughts..."
                className="min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Date
              </label>
              <div className="flex items-center border rounded-md p-2">
                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Mood
              </label>
              <Select value={newEntryMood} onValueChange={setNewEntryMood}>
                <SelectTrigger>
                  <SelectValue placeholder="How are you feeling?" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newEntryTags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center space-x-1 group dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    <span>{tag}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => handleRemoveTag(tag, false, e)}
                    />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="tag-input"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add a tag"
                  aria-label="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => handleAddTag()}>
                  Add
                </Button>
              </div>
              {popularTags.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground mb-1">Popular tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {popularTags.slice(0, 6).map(tag => (
                      <span 
                        key={tag}
                        className="text-xs bg-secondary/60 px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-secondary"
                        onClick={() => {
                          if (!newEntryTags.includes(tag)) {
                            setNewEntryTags([...newEntryTags, tag]);
                          }
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewEntryDialog(false);
                resetNewEntryForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEntry}>
              <PenSquare className="mr-2 h-4 w-4" />
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Entry Dialog */}
      <Dialog open={showViewEntryDialog} onOpenChange={setShowViewEntryDialog}>
        <DialogContent className="sm:max-w-lg">
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedEntry.title}</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${isEnhancing ? 'pointer-events-none' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isEnhancing) {
                          handleEnhanceEntry(selectedEntry);
                        }
                      }}
                      disabled={isEnhancing}
                      title="Enhance with AI"
                    >
                      {isEnhancing ? (
                        <div className="h-5 w-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(selectedEntry);
                      }}
                      title={selectedEntry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={selectedEntry.isFavorite ? "h-4 w-4 text-amber-400 fill-amber-400" : "h-4 w-4"} />
                    </Button>
                  </div>
                </div>
                <DialogDescription className="flex items-center justify-between">
                  <span>{formatEntryDate(selectedEntry.date)}</span>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getMoodColor(selectedEntry.mood)}`}></span>
                    <span className="text-xs">{getMoodEmoji(selectedEntry.mood)}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="whitespace-pre-line">
                    {selectedEntry.content}
                  </div>
                  
                  {/* Display attached files */}
                  {selectedEntry.attachedFiles && selectedEntry.attachedFiles.length > 0 && (
                    <div className="mt-6 border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-700">Attached Files</h3>
                        <span className="text-xs text-slate-500">
                          {selectedEntry.attachedFiles.length} {selectedEntry.attachedFiles.length === 1 ? 'File' : 'Files'} Attached
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedEntry.attachedFiles.map(file => {
                          // Determine the correct URL to use
                          let fileUrl = file.publicUrl || file.url;

                          // For files with storagePath but without a publicUrl, generate one
                          if (!fileUrl && file.storagePath) {
                            fileUrl = getFileUrl(file.storagePath);
                          }

                          // Ensure the file URL is valid
                          if (!fileUrl) {
                            console.error("No URL available for file:", file);
                            return null;
                          }

                          // Get file name from metadata field or fallback
                          const fileName = file.fileName || file.file?.name || `${file.type} file`;

                          return (
                            <div 
                              key={file.id}
                              className="relative bg-slate-50 border border-slate-200 rounded-md p-3 flex flex-col items-center hover:bg-slate-100 hover:shadow-sm transition-all cursor-pointer group"
                              onClick={() => handleViewAttachedFile(file, fileUrl)}
                            >
                              {/* File icon based on type */}
                              <div className="mb-2 relative">
                                {file.type === 'image' && <ImageIcon className="h-8 w-8 text-blue-500" />}
                                {file.type === 'video' && <Video className="h-8 w-8 text-purple-500" />}
                                {file.type === 'audio' && <Music className="h-8 w-8 text-green-500" />}
                                {file.type === 'pdf' && <FileText className="h-8 w-8 text-red-500" />}
                                {!['image', 'video', 'audio', 'pdf'].includes(file.type) && 
                                  <FileIcon className="h-8 w-8 text-gray-500" />
                                }
                                
                                {/* Add a preview indicator */}
                                <div className="absolute opacity-0 group-hover:opacity-100 inset-0 bg-black/30 rounded-full flex items-center justify-center transition-opacity">
                                  <Maximize className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              
                              {/* File name */}
                              <span className="text-xs text-center text-slate-700 line-clamp-2">
                                {fileName}
                              </span>
                              
                              {/* Click to view indicator */}
                              <span className="text-[10px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.type === 'pdf' ? 'Open in new tab' : 'Click to preview'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedEntry.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center space-x-1 group dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      <span>{tag}</span>
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => handleRemoveTag(tag, false, e)}
                      />
                    </span>
                  ))}
                </div>
              )}
              
              <DialogFooter className="flex justify-between items-center border-t pt-4 mt-2">
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedEntry.updatedAt && selectedEntry.createdAt && 
                   !isSameDay(selectedEntry.updatedAt, selectedEntry.createdAt) ? (
                    <span>
                      Updated {format(new Date(selectedEntry.updatedAt), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span>
                      Created {format(new Date(selectedEntry.createdAt || selectedEntry.date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmDeleteDialog(true);
                    }}
                    className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditEntryPage(selectedEntry.id)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Entry Dialog */}
      <Dialog open={showEditEntryDialog} onOpenChange={setShowEditEntryDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
            <DialogDescription>
              Update your thoughts, feelings, and experiences
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Title
                </label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-favorite" className="text-xs text-muted-foreground">Favorite</Label>
                  <Switch 
                    id="edit-favorite"
                    checked={editEntryIsFavorite}
                    onCheckedChange={setEditEntryIsFavorite}
                  />
                </div>
              </div>
              <Input
                id="edit-title"
                value={editEntryTitle}
                onChange={(e) => setEditEntryTitle(e.target.value)}
                placeholder="Give your entry a title"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="edit-content" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="edit-content"
                value={editEntryContent}
                onChange={(e) => setEditEntryContent(e.target.value)}
                placeholder="Write your thoughts..."
                className="min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Mood
              </label>
              <Select value={editEntryMood} onValueChange={setEditEntryMood}>
                <SelectTrigger>
                  <SelectValue placeholder="How are you feeling?" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editEntryTags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center space-x-1 group dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    <span>{tag}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => handleRemoveTag(tag, true, e)}
                    />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(true);
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => handleAddTag(true)}>
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditEntryDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEntry}>
              <PenSquare className="mr-2 h-4 w-4" />
              Update Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEntry}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Dialog */}
      {entryToExport && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => {
            setShowExportDialog(false);
            setEntryToExport(null);
          }}
          title={entryToExport.title}
          contentRef={entryContentRef}
        />
      )}
      
      {/* Create a hidden div to store entry content for export */}
      <div className="hidden">
        <div 
          ref={entryContentRef}
          dangerouslySetInnerHTML={{ __html: entryToExport?.rawContent || entryToExport?.content || '' }}
        />
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <AlertDialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <AlertDialogContent className="max-w-4xl overflow-hidden p-0">
            <div className="relative bg-black flex flex-col items-center justify-center p-4">
              <AlertDialogCancel className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70 z-50">
                <X size={18} />
              </AlertDialogCancel>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-2 left-2 text-white bg-black/50 hover:bg-black/70 z-50"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = selectedImage.url;
                  a.download = selectedImage.name;
                  a.click();
                }}
                title="Download image"
              >
                <Download size={18} />
              </Button>
              <div className="relative min-h-[30vh] flex items-center justify-center mt-8">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.name}
                  className="max-h-[65vh] max-w-full object-contain" 
                  style={{ zIndex: 10 }}
                  onError={(e) => {
                    console.error("Error loading image:", e, selectedImage.url);
                    toast.error("Failed to load image");
                    
                    // Attempt to refresh the URL if it's a Supabase URL
                    if (selectedImage.url.includes('supabase')) {
                      toast.info("Attempting to refresh the image...");
                      // Reload the image with a cache-busting parameter
                      (e.target as HTMLImageElement).src = `${selectedImage.url}?t=${Date.now()}`;
                    }
                  }}
                />
              </div>
              <p className="text-white/80 text-sm mt-2">{selectedImage.name}</p>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Video Preview Modal */}
      {selectedVideo && (
        <AlertDialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <AlertDialogContent className="max-w-4xl overflow-hidden p-0">
            <div className="relative bg-black flex flex-col items-center justify-center p-4">
              <AlertDialogCancel className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70 z-50">
                <X size={18} />
              </AlertDialogCancel>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-2 left-2 text-white bg-black/50 hover:bg-black/70 z-50"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = selectedVideo.url;
                  a.download = selectedVideo.name;
                  a.click();
                }}
                title="Download video"
              >
                <Download size={18} />
              </Button>
              <div className="min-h-[30vh] flex items-center justify-center mt-8">
                <video 
                  src={selectedVideo.url} 
                  controls
                  autoPlay
                  className="max-h-[65vh] max-w-full" 
                  style={{ zIndex: 10 }}
                  onError={(e) => {
                    console.error("Error loading video:", e, selectedVideo.url);
                    toast.error("Failed to load video - try downloading it instead");
                    
                    // Add a fallback message
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = "p-4 bg-gray-800 text-white rounded";
                      fallback.textContent = "Unable to play this video. Try downloading it instead.";
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <p className="text-white/80 text-sm mt-2">{selectedVideo.name}</p>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Audio Preview Modal */}
      {selectedAudio && (
        <AlertDialog open={!!selectedAudio} onOpenChange={() => setSelectedAudio(null)}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedAudio.name}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4 border rounded-md">
              <div className="min-h-[50px]">
                <audio 
                  src={selectedAudio.url} 
                  controls
                  autoPlay
                  className="w-full" 
                  onError={(e) => {
                    console.error("Error loading audio:", e, selectedAudio.url);
                    toast.error("Failed to load audio - try downloading it instead");
                    
                    // Add a fallback message
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = "p-2 mt-2 bg-gray-100 text-red-500 text-sm rounded";
                      fallback.textContent = "Unable to play this audio file. Try downloading it instead.";
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <Button 
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = selectedAudio.url;
                  a.download = selectedAudio.name;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Journal;
