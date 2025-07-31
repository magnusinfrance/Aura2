import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Upload, 
  FileAudio, 
  Plus,
  HardDrive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SoundCloudWidget } from './SoundCloudWidget';

interface FileManagerProps {
  onFilesAdd: (files: File[]) => void;
  onTrackAdd?: (track: any) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ onFilesAdd, onTrackAdd }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const supportedFormats = [
    '.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma', '.mod', '.s3m', '.xm', '.it'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const audioFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return supportedFormats.includes(extension);
    });

    if (audioFiles.length === 0) {
      toast({
        title: "No audio files found",
        description: "Please select files with supported formats: " + supportedFormats.join(', '),
        variant: "destructive",
      });
      return;
    }

    if (audioFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: `${audioFiles.length} of ${files.length} files were added. Only audio files are supported.`,
      });
    } else {
      toast({
        title: "Files added successfully",
        description: `Added ${audioFiles.length} audio file${audioFiles.length !== 1 ? 's' : ''} to your library.`,
      });
    }

    onFilesAdd(audioFiles);
  };

  const processDirectoryEntry = async (entry: any): Promise<File[]> => {
    const files: File[] = [];
    
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => {
          const extension = '.' + file.name.split('.').pop()?.toLowerCase();
          if (supportedFormats.includes(extension)) {
            files.push(file);
          }
          resolve(files);
        });
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      return new Promise((resolve) => {
        reader.readEntries(async (entries: any[]) => {
          const promises = entries.map(processDirectoryEntry);
          const results = await Promise.all(promises);
          resolve(results.flat());
        });
      });
    }
    
    return files;
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const items = event.dataTransfer.items;
    const allFiles: File[] = [];
    
    if (items) {
      const promises = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            promises.push(processDirectoryEntry(entry));
          }
        }
      }
      
      const results = await Promise.all(promises);
      allFiles.push(...results.flat());
    } else {
      // Fallback for older browsers
      const files = Array.from(event.dataTransfer.files);
      allFiles.push(...files);
    }
    
    handleFiles(allFiles);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <HardDrive className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">File Manager</h3>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${dragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className={`h-8 w-8 mx-auto mb-3 ${
          dragOver ? 'text-primary' : 'text-muted-foreground'
        }`} />
        <h4 className="font-medium mb-1">
          {dragOver ? 'Drop files/folders here' : 'Drag & drop audio files or folders'}
        </h4>
        <p className="text-sm text-muted-foreground">
          Supports nested folders • Click below to browse
        </p>
      </div>

      {/* File Selection Buttons */}
      <div className="grid grid-cols-1 gap-2">
        <Button
          variant="outline"
          className="justify-start bg-player-elevated border-border hover:bg-player-surface"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileAudio className="h-4 w-4 mr-2" />
          Add Audio Files
        </Button>

        <Button
          variant="outline"
          className="justify-start bg-player-elevated border-border hover:bg-player-surface"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Add Folder
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={supportedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore - webkitdirectory is not in the standard types
        webkitdirectory=""
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* SoundCloud Widget */}
      {onTrackAdd && (
        <>
          <div className="border-t border-border pt-4">
            <SoundCloudWidget onTrackAdd={onTrackAdd} />
          </div>
        </>
      )}

      {/* Supported Formats */}
      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">Supported formats:</p>
        <p>{supportedFormats.join(', ')}</p>
      </div>

    </div>
  );
};