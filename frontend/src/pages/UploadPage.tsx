import { useState } from 'react';
import { resumeApi } from '../api/resume';
import { getErrorMessage } from '../api/request';
import FileUploadCard from '../components/FileUploadCard';

interface UploadPageProps {
  onUploadComplete: (resumeId: number) => void;
}

export default function UploadPage({ onUploadComplete }: UploadPageProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (file: File) => {
  setUploading(true);
  setError('');

  try {
    const data = await resumeApi.uploadAndAnalyze(file);

    // 提取简历ID（兼容新上传和重复上传）
    let resumeId: number | undefined;

    if (data.storage && typeof data.storage.resumeId === 'number') {
      resumeId = data.storage.resumeId;
    } else if (data.resume && typeof data.resume.id === 'number') {
      resumeId = data.resume.id;
    } else if (typeof (data as any).resumeId === 'number') {
      resumeId = (data as any).resumeId;
    }

    if (resumeId === undefined) {
      throw new Error('上传失败，未返回简历ID');
    }

    // 如果是重复简历，弹出提示
    if (data.duplicate === true) {
      alert('该简历已存在，将跳转到简历页面（如果未发现，请检查其他账号）');
    }

    onUploadComplete(resumeId);
  } catch (err) {
    setError(getErrorMessage(err));
    setUploading(false);
  }
};

  return (
    <FileUploadCard
      title="开始您的 AI 模拟面试"
      subtitle="上传 PDF 或 Word 简历，AI 将为您定制专属面试方案"
      accept=".pdf,.doc,.docx,.txt"
      formatHint="支持 PDF, DOCX, TXT"
      maxSizeHint="最大 10MB"
      uploading={uploading}
      uploadButtonText="开始上传"
      selectButtonText="选择简历文件"
      error={error}
      onUpload={handleUpload}
    />
  );
}
