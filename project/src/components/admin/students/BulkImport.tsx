import { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Upload, Download, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

interface BulkImportProps {
  type: 'students' | 'staff';
  onClose: () => void;
  onComplete: () => void;
}

export default function BulkImport({ type, onClose, onComplete }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    let headers: string[];
    let sampleRow: string[];

    if (type === 'students') {
      headers = ['TC No', 'Ad', 'Soyad', 'Telefon', 'Doğum Tarihi', 'Veli Adı', 'Veli Telefon', 'Veli Email', 'Adres', 'Sınıf', 'Bölüm', 'Okul Adı', 'Grup Adı', 'Bireysel Ders (Evet/Hayır)', 'Toplam Ücret', 'Peşinat', 'Taksit Sayısı', 'Notlar'];
      sampleRow = ['12345678901', 'Ahmet', 'Yılmaz', '5551234567', '2005-01-15', 'Mehmet Yılmaz', '5559876543', 'mehmet@email.com', 'Ankara', '12', 'TYT', 'Ankara Lisesi', 'TYT-A', 'Hayır', '10000', '2000', '4', 'Örnek not'];
    } else {
      headers = ['TC No', 'Ad', 'Soyad', 'Email', 'Telefon', 'Doğum Tarihi', 'Adres', 'Pozisyon', 'Aylık Maaş', 'İşe Başlama Tarihi', 'Dersler (virgülle ayırın)', 'Notlar'];
      sampleRow = ['98765432109', 'Ayşe', 'Demir', 'ayse@email.com', '5551112233', '1990-03-20', 'İstanbul', 'Öğretmen', '15000', '2024-01-01', 'Matematik,Geometri', 'Deneme not'];
    }

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_template.csv`;
    link.click();
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const processStudentsImport = async (rows: string[][]): Promise<{ success: number; failed: number; errors: string[] }> => {
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 10) {
        errors.push(`Satır ${i + 1}: Eksik veri`);
        failedCount++;
        continue;
      }

      try {
        const studentData = {
          student_no: String(1000 + i),
          tc_no: row[0],
          first_name: row[1],
          last_name: row[2],
          phone: row[3],
          birth_date: row[4] || null,
          parent_name: row[5],
          parent_phone: row[6],
          parent_email: row[7],
          address: row[8],
          grade: row[9],
          department: row[10],
          school_name: row[11],
          group_course: row[12],
          has_private_lesson: row[13]?.toLowerCase() === 'evet',
          total_fee: parseFloat(row[14]) || 0,
          paid_amount: parseFloat(row[15]) || 0,
          remaining_amount: (parseFloat(row[14]) || 0) - (parseFloat(row[15]) || 0),
          installment_count: parseInt(row[16]) || 1,
          notes: row[17] || '',
          status: 'active',
          registration_date: new Date().toISOString().split('T')[0]
        };

        const { error } = await supabase.from('students').insert([studentData]);

        if (error) {
          errors.push(`Satır ${i + 1}: ${error.message}`);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (error: any) {
        errors.push(`Satır ${i + 1}: ${error.message}`);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, errors };
  };

  const processStaffImport = async (rows: string[][]): Promise<{ success: number; failed: number; errors: string[] }> => {
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 8) {
        errors.push(`Satır ${i + 1}: Eksik veri`);
        failedCount++;
        continue;
      }

      try {
        const subjects = row[10] ? row[10].split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];

        const staffData = {
          tc_no: row[0],
          first_name: row[1],
          last_name: row[2],
          email: row[3],
          phone: row[4],
          birth_date: row[5] || null,
          address: row[6],
          position: row[7],
          monthly_salary: parseFloat(row[8]) || 0,
          hire_date: row[9] || new Date().toISOString().split('T')[0],
          status: 'active',
          is_active: true,
          subjects: subjects.length > 0 ? subjects : null,
          notes: row[11] || ''
        };

        const { data: insertedStaff, error: staffError } = await supabase
          .from('staff')
          .insert([staffData])
          .select()
          .single();

        if (staffError) {
          errors.push(`Satır ${i + 1}: ${staffError.message}`);
          failedCount++;
          continue;
        }

        if (subjects.length > 0 && insertedStaff) {
          const teacherSubjects = subjects.map(subject => ({
            teacher_id: insertedStaff.id,
            subject: subject
          }));

          const { error: subjectError } = await supabase
            .from('teacher_subjects')
            .insert(teacherSubjects);

          if (subjectError) {
            errors.push(`Satır ${i + 1}: Dersler eklenemedi - ${subjectError.message}`);
          }
        }

        successCount++;
      } catch (error: any) {
        errors.push(`Satır ${i + 1}: ${error.message}`);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, errors };
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      const rows = parseCSV(text);

      if (rows.length < 2) {
        alert('CSV dosyası en az 1 veri satırı içermelidir');
        setUploading(false);
        return;
      }

      let importResult;
      if (type === 'students') {
        importResult = await processStudentsImport(rows);
      } else {
        importResult = await processStaffImport(rows);
      }

      setResult(importResult);

      if (importResult.success > 0) {
        await supabase.from('bulk_imports').insert([{
          import_type: type,
          file_name: file.name,
          total_rows: rows.length - 1,
          successful_rows: importResult.success,
          failed_rows: importResult.failed,
          error_log: importResult.errors.length > 0 ? importResult.errors : null,
          status: 'completed',
          completed_at: new Date().toISOString()
        }]);
      }

      if (importResult.success > 0) {
        setTimeout(() => {
          onComplete();
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      alert('Dosya işlenirken hata oluştu: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            Toplu {type === 'students' ? 'Öğrenci' : 'Personel'} İçe Aktarma
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Nasıl Kullanılır?</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Önce şablon dosyasını indirin</li>
              <li>Excel ile açın ve verilerinizi girin</li>
              <li>CSV formatında kaydedin (UTF-8 kodlamalı)</li>
              <li>Dosyayı yükleyin</li>
            </ol>
          </div>

          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Şablon Dosyasını İndir</span>
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </button>

          <div>
            <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>CSV dosyası seçin</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {file ? file.name : 'Sadece CSV formatı'}
                </p>
              </div>
            </div>
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">
                  Başarıyla eklenen: {result.success}
                </span>
              </div>
              {result.failed > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-semibold text-red-800">
                      Başarısız: {result.failed}
                    </span>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <p className="text-xs text-red-700 font-semibold mb-1">Hatalar:</p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {result.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                        {result.errors.length > 10 && (
                          <li>... ve {result.errors.length - 10} hata daha</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {result && result.success > 0 ? 'Kapat' : 'İptal'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Yükleniyor...' : 'Yükle ve İçe Aktar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
