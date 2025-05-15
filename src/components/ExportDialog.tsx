import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { PaintBrush, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { format } from 'date-fns';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contentRef: React.RefObject<HTMLDivElement>;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, title, contentRef }) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html' | 'image'>('pdf');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [paperSize, setPaperSize] = useState('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isExporting, setIsExporting] = useState(false);
  
  const exportContainerRef = useRef<HTMLDivElement>(null);
  
  const handleExport = async () => {
    if (!contentRef.current) {
      toast.error("Content not available for export");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Create a clone of the content for exporting
      const contentClone = contentRef.current.cloneNode(true) as HTMLElement;
      
      // Replace data URLs with Supabase URLs if available
      if (includeImages) {
        // Find all images in the content
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
          // Check if the image has a data-supabase-url attribute (this would be a custom attribute we've added)
          const supabaseUrl = img.getAttribute('data-supabase-url');
          if (supabaseUrl) {
            img.src = supabaseUrl;
          }
        });
      }
      
      // Apply styling based on selected theme and font size
      contentClone.style.fontFamily = 'Arial, sans-serif';
      
      switch (theme) {
        case 'light':
          contentClone.style.color = '#333';
          contentClone.style.backgroundColor = '#fff';
          break;
        case 'dark':
          contentClone.style.color = '#eee';
          contentClone.style.backgroundColor = '#333';
          break;
        case 'sepia':
          contentClone.style.color = '#5b4636';
          contentClone.style.backgroundColor = '#f4ecd8';
          break;
      }
      
      switch (fontSize) {
        case 'small':
          contentClone.style.fontSize = '14px';
          break;
        case 'medium':
          contentClone.style.fontSize = '16px';
          break;
        case 'large':
          contentClone.style.fontSize = '18px';
          break;
      }
      
      // If we don't want to include images
      if (!includeImages) {
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
          img.style.display = 'none';
        });
      }
      
      // Add metadata if requested
      if (includeMetadata) {
        const metadataDiv = document.createElement('div');
        metadataDiv.style.marginBottom = '20px';
        metadataDiv.style.borderBottom = '1px solid #ccc';
        metadataDiv.style.paddingBottom = '10px';
        
        const titleHeader = document.createElement('h1');
        titleHeader.textContent = title || 'Journal Entry';
        titleHeader.style.marginBottom = '5px';
        
        const dateText = document.createElement('p');
        dateText.textContent = `Exported on ${format(new Date(), 'PPP')}`;
        dateText.style.fontStyle = 'italic';
        dateText.style.fontSize = '14px';
        
        metadataDiv.appendChild(titleHeader);
        metadataDiv.appendChild(dateText);
        
        contentClone.insertBefore(metadataDiv, contentClone.firstChild);
      }
      
      // Place the clone in our export container
      if (exportContainerRef.current) {
        exportContainerRef.current.innerHTML = '';
        exportContainerRef.current.appendChild(contentClone);
        
        switch (exportFormat) {
          case 'pdf':
            // Using html2pdf.js or similar library here
            toast.success("PDF export functionality would be implemented here");
            // For a real implementation, use html2pdf.js or jsPDF
            break;
            
          case 'html':
            // Export as HTML
            const htmlBlob = new Blob([contentClone.outerHTML], { type: 'text/html' });
            const htmlUrl = URL.createObjectURL(htmlBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = htmlUrl;
            downloadLink.download = `${title || 'journal-entry'}-${format(new Date(), 'yyyy-MM-dd')}.html`;
            downloadLink.click();
            URL.revokeObjectURL(htmlUrl);
            toast.success("HTML file exported");
            break;
            
          case 'image':
            // Export as image
            const canvas = await html2canvas(contentClone);
            const imgUrl = canvas.toDataURL('image/png');
            const downloadImgLink = document.createElement('a');
            downloadImgLink.href = imgUrl;
            downloadImgLink.download = `${title || 'journal-entry'}-${format(new Date(), 'yyyy-MM-dd')}.png`;
            downloadImgLink.click();
            toast.success("Image exported");
            break;
        }
      }
    } catch (error) {
      console.error("Error during export:", error);
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Journal Entry</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="format" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="format" className="flex-1">Format</TabsTrigger>
            <TabsTrigger value="style" className="flex-1">Style</TabsTrigger>
            <TabsTrigger value="options" className="flex-1">Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="format" className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Export Format</h3>
                <RadioGroup 
                  value={exportFormat} 
                  onValueChange={(value) => setExportFormat(value as any)}
                  className="flex gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      PDF
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="html" id="html" />
                    <Label htmlFor="html" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      HTML
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image" className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {exportFormat === 'pdf' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Paper Size</h3>
                    <Select value={paperSize} onValueChange={setPaperSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select paper size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Orientation</h3>
                    <RadioGroup 
                      value={orientation} 
                      onValueChange={(value) => setOrientation(value as any)}
                      className="flex gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="portrait" id="portrait" />
                        <Label htmlFor="portrait">Portrait</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="landscape" id="landscape" />
                        <Label htmlFor="landscape">Landscape</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="style" className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Theme</h3>
                <RadioGroup 
                  value={theme} 
                  onValueChange={(value) => setTheme(value as any)}
                  className="grid grid-cols-3 gap-2"
                >
                  <div className="flex items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-slate-50" onClick={() => setTheme('light')}>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-8 bg-white border"></div>
                      <Label className="mt-1 text-xs">Light</Label>
                      <RadioGroupItem value="light" id="light" className="sr-only" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-slate-50" onClick={() => setTheme('dark')}>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-8 bg-gray-800 border"></div>
                      <Label className="mt-1 text-xs">Dark</Label>
                      <RadioGroupItem value="dark" id="dark" className="sr-only" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-slate-50" onClick={() => setTheme('sepia')}>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-8 bg-[#f4ecd8] border"></div>
                      <Label className="mt-1 text-xs">Sepia</Label>
                      <RadioGroupItem value="sepia" id="sepia" className="sr-only" />
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Font Size</h3>
                <RadioGroup 
                  value={fontSize} 
                  onValueChange={(value) => setFontSize(value as any)}
                  className="flex gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">Small</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large">Large</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="options" className="py-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="include-metadata"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Metadata
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add title and export date to the document
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="include-images"
                  checked={includeImages}
                  onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="include-images"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Images
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Include any images or attachments in the export
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">◌</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
        
        {/* Hidden export container */}
        <div ref={exportContainerRef} className="hidden"></div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog; 