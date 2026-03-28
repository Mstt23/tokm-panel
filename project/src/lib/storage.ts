import { supabase } from './supabase';

export type BucketName = 'announcements-images' | 'documents' | 'gallery' | 'gallery-images' | 'testimonial-images';

export interface UploadOptions {
  bucket: BucketName;
  file: File;
  path?: string;
}

export const uploadFile = async ({ bucket, file, path }: UploadOptions) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const deleteFile = async (bucket: BucketName, path: string) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
};

export const getPublicUrl = (bucket: BucketName, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const listFiles = async (bucket: BucketName, path: string = '') => {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) throw error;

    return { success: true, files: data };
  } catch (error) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
};
