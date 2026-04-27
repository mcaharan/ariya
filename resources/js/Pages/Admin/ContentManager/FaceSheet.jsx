import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export function FaceSheetManager({ child }) {
    const [file, setFile] = useState(null);
    const inputRef = useRef(null);
    const hasPdf = !!child.face_sheet_pdf;
    const upload = () => {
        if (!file) return;
        const fd = new FormData();
        fd.append('pdf', file);
        router.post(route('children.face-sheet', child.id), fd, { forceFormData: true, preserveScroll: true, onSuccess: () => { setFile(null); if (inputRef.current) inputRef.current.value = ''; } });
    };
    const remove = () => {
        if (!confirm('Remove the current face sheet PDF?')) return;
        router.delete(route('children.face-sheet.destroy', child.id), { preserveScroll: true });
    };
    return (
        <div className="space-y-4">
            {hasPdf && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800">PDF uploaded</p>
                        <a href={`/storage/${child.face_sheet_pdf}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline truncate block">View current PDF</a>
                    </div>
                    <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">Remove</button>
                </div>
            )}
            <div className="flex items-center gap-3">
                <input ref={inputRef} type="file" accept=".pdf" className="flex-1 text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" onChange={(e) => setFile(e.target.files[0] || null)} />
                <PrimaryButton onClick={upload} disabled={!file}>{hasPdf ? 'Replace' : 'Upload'}</PrimaryButton>
            </div>
        </div>
    );
}
