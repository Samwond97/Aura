import { useState } from 'react';
import { uploadFile, getFileUrl, downloadFile, deleteFile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface FileUploaderProps {
  onFileUploaded?: (filePath: string, fileUrl: string) => void;
}

export function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Upload the file to Supabase storage
      const filePath = await uploadFile(selectedFile);
      
      if (!filePath) {
        throw new Error('File upload failed');
      }
      
      // Get the public URL of the uploaded file
      const fileUrl = getFileUrl(filePath);
      
      // Set the uploaded file info
      setUploadedFilePath(filePath);
      setUploadedFileUrl(fileUrl);
      
      // Call the callback if provided
      if (onFileUploaded) {
        onFileUploaded(filePath, fileUrl);
      }
      
      // Reset the file input
      setSelectedFile(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!uploadedFilePath) {
      setError('No file to download');
      return;
    }
    
    try {
      const blob = await downloadFile(uploadedFilePath);
      
      if (!blob) {
        throw new Error('File download failed');
      }
      
      // Create a download link for the blob
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadedFilePath.split('/').pop() || 'downloaded-file';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  const handleDelete = async () => {
    if (!uploadedFilePath) {
      setError('No file to delete');
      return;
    }
    
    try {
      const success = await deleteFile(uploadedFilePath);
      
      if (!success) {
        throw new Error('File deletion failed');
      }
      
      // Reset the uploaded file info
      setUploadedFilePath(null);
      setUploadedFileUrl(null);
      
      alert('File deleted successfully');
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-medium">File Upload</h3>
      
      <div className="space-y-2">
        <Input
          type="file"
          onChange={handleFileChange}
          className="max-w-sm"
        />
        
        <div className="flex space-x-2">
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
          
          {uploadedFilePath && (
            <>
              <Button 
                variant="outline" 
                onClick={handleDownload}
              >
                Download File
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleDelete}
              >
                Delete File
              </Button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
      
      {uploadedFileUrl && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">File uploaded successfully!</p>
          
          <div className="max-w-md overflow-hidden text-ellipsis">
            <p className="text-xs text-gray-400">Path: {uploadedFilePath}</p>
            <p className="text-xs text-gray-400">URL: {uploadedFileUrl}</p>
          </div>
          
          {uploadedFileUrl.match(/\.(jpeg|jpg|gif|png)$/i) && (
            <div className="border rounded-md overflow-hidden max-w-xs">
              <img 
                src={uploadedFileUrl} 
                alt="Uploaded" 
                className="w-full h-auto"
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
} 