import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, File as FileIcon, Loader2 } from 'lucide-react';
import { uploadFile, BucketName } from '../lib/storage';

interface FileUploadProps {
  bucket: BucketName;
  onUploadComplete?: (url: string, path: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function FileUpload({
  bucket,
  onUploadComplete,
  accept = 'image/*',
  maxSizeMB = 5,
  label = 'Dosya Yükle',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır`);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    setUploading(true);

    const result = await uploadFile({ bucket, file });

    setUploading(false);

    if (result.success && result.url && result.path) {
      onUploadComplete?.(result.url, result.path);
    } else {
      setError(result.error || 'Yükleme başarısız');
      setPreview(null);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
          />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              uploading
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-2" />
                <p className="text-sm text-gray-600">Yükleniyor...</p>
              </>
            ) : (
              <>
                {bucket === 'documents' ? (
                  <FileIcon className="w-12 h-12 text-gray-400 mb-2" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                )}
                <div className="flex items-center space-x-2 mb-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    Dosya seçmek için tıklayın
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Maksimum dosya boyutu: {maxSizeMB}MB
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
