import { useState, useRef } from 'react';
import { api } from '../../lib/api';

export default function ChoreProofUpload({ choreId }: { choreId?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[CHILD][ChoreProofUpload] file selected', { name: file.name, size: file.size });
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const upload = async () => {
    if (!preview) return;
    setUploading(true);
    console.log('[CHILD][ChoreProofUpload] upload started', { choreId });
    await api.chores.submitProof(choreId ?? 'unknown', preview);
    console.log('[CHILD][ChoreProofUpload] upload complete', { choreId });
    setUploading(false);
    setUploaded(true);
  };

  if (uploaded) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <p className="text-3xl mb-2">📸</p>
        <p className="font-bold text-emerald-700">Photo submitted!</p>
        <p className="text-sm text-emerald-600 mt-1">Your parent will review it soon.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-6">
      <h2 className="text-xl font-bold text-stone-900 mb-2 flex items-center gap-2"><span>📸</span> Prove It!</h2>
      <p className="text-sm text-stone-500 mb-4">Take a photo of your completed chore so your parent can approve it.</p>

      {!preview ? (
        <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-violet-300 rounded-2xl py-12 flex flex-col items-center gap-3 hover:border-violet-500 hover:bg-violet-50 transition-colors">
          <span className="text-4xl">📷</span>
          <p className="text-violet-700 font-semibold">Tap to add a photo</p>
          <p className="text-xs text-stone-400">JPG, PNG up to 10MB</p>
        </button>
      ) : (
        <div className="space-y-3">
          <img src={preview} alt="Proof preview" className="w-full rounded-xl border border-slate-200" />
          <div className="flex gap-3">
            <button onClick={upload} disabled={uploading} className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {uploading ? 'Sending...' : 'Submit Proof ✅'}
            </button>
            <button onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ''; }} className="px-4 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50">
              Redo
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
    </div>
  );
}
