import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { Skeleton } from '@/components/ui/skeleton';

interface AvatarUploadProps {
  onUpload: (url: string) => void;
  currentAvatarUrl?: string | null;
}

export function AvatarUpload({ onUpload, currentAvatarUrl }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { url: resolvedAvatarUrl, isLoading } = useAvatarUrl(currentAvatarUrl);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Avatar upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to upload avatar: ${errorText}`);
      }

      const data = await response.json();
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-2">
      <Label>Avatar</Label>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="mb-4 mx-auto w-24 h-24">
            <Skeleton className="w-full h-full rounded-full" />
          </div>
        ) : resolvedAvatarUrl && (
          <div className="mb-4 mx-auto w-24 h-24 relative overflow-hidden rounded-full">
            <img
              src={resolvedAvatarUrl}
              alt="Current avatar"
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-gray-400" />
          {isDragActive ? (
            <p>Drop the image here...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Select Image'}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
} 