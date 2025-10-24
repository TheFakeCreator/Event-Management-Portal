'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, File, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  cloudinary,
  validateCloudinaryFile,
  type CloudinaryUploadResponse,
  type UploadOptions,
} from '@/lib/cloudinary';
import { env } from '@/lib/env';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  url?: string;
  publicId?: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
  folder?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md', '.doc', '.docx'],
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  onFilesChange,
  folder = 'uploads',
  className,
  disabled = false,
  multiple = true,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { success, error: showError } = useToast();

  // Listen for Cloudinary upload progress events
  useEffect(() => {
    const handleProgress = (event: CustomEvent) => {
      const { percentComplete, file } = event.detail;
      setFiles((prev) =>
        prev.map((f) =>
          f.file.name === file && f.status === 'uploading'
            ? { ...f, progress: percentComplete }
            : f
        )
      );
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'cloudinary-upload-progress',
        handleProgress as EventListener
      );
      return () => {
        window.removeEventListener(
          'cloudinary-upload-progress',
          handleProgress as EventListener
        );
      };
    }
  }, []);

  const uploadToCloudinary = async (
    file: File,
    uploadId: string
  ): Promise<void> => {
    try {
      // Validate file using our environment configuration
      const validation = validateCloudinaryFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Update progress to show upload starting
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadId ? { ...f, progress: 10, status: 'uploading' } : f
        )
      );

      // Set up upload options
      const uploadOptions: UploadOptions = {
        folder,
        tags: ['event-management', 'user-upload'],
        context: {
          uploadId,
          timestamp: new Date().toISOString(),
        },
      };

      // Use our Cloudinary service
      const result: CloudinaryUploadResponse = await cloudinary.uploadFile(
        file,
        uploadOptions
      );

      // Update file with success
      setFiles((prev) => {
        const updated = prev.map((f) =>
          f.id === uploadId
            ? {
                ...f,
                status: 'uploaded' as const,
                progress: 100,
                url: result.secure_url,
                publicId: result.public_id,
              }
            : f
        );
        onFilesChange?.(updated);
        return updated;
      });

      success('Upload Successful', `${file.name} uploaded successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';

      setFiles((prev) => {
        const updated = prev.map((f) =>
          f.id === uploadId
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        );
        onFilesChange?.(updated);
        return updated;
      });

      showError('Upload Failed', errorMessage);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            showError(
              'File Too Large',
              `${file.name} is larger than ${maxSize / 1024 / 1024}MB`
            );
          } else if (error.code === 'file-invalid-type') {
            showError(
              'Invalid File Type',
              `${file.name} is not a supported file type`
            );
          } else {
            showError('Upload Error', error.message);
          }
        });
      });

      // Process accepted files
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => {
        const id = Math.random().toString(36).substring(2);

        return {
          id,
          file,
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
          status: 'uploading' as const,
          progress: 0,
        };
      });

      setFiles((prev) => {
        const updated = [...prev, ...newFiles];

        // Check if we exceed max files
        if (updated.length > maxFiles) {
          showError('Too Many Files', `Maximum ${maxFiles} files allowed`);
          return prev;
        }

        onFilesChange?.(updated);
        return updated;
      });

      // Start uploads
      newFiles.forEach(({ id, file }) => {
        uploadToCloudinary(file, id);
      });
    },
    [
      maxFiles,
      maxSize,
      onFilesChange,
      showError,
      success,
      folder,
      uploadToCloudinary,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    disabled,
    multiple,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      onFilesChange?.(updated);
      return updated;
    });
  };

  const retryUpload = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      uploadToCloudinary(file.file, id);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    return File;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />

        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Supports images, PDFs, and documents up to {maxSize / 1024 / 1024}
              MB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum {maxFiles} files
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploaded Files</h4>

          {files.map((uploadedFile) => {
            const Icon = getFileIcon(uploadedFile.file);

            return (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Progress Bar */}
                  {uploadedFile.status === 'uploading' && (
                    <Progress value={uploadedFile.progress} className="mt-2" />
                  )}

                  {/* Error Message */}
                  {uploadedFile.status === 'error' && (
                    <p className="text-sm text-destructive mt-1">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'uploaded' && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}

                  {uploadedFile.status === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(uploadedFile.id)}
                      >
                        Retry
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
