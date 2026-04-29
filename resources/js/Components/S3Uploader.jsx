import { useState, useRef } from 'react';

export default function S3Uploader({
    folder = 'uploads',
    accept = '*',
    label = 'Upload to S3',
    onUpload,
}) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        setResult(null);

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder);

        try {
            const res = await window.axios.post(route('s3.upload'), fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(res.data);
            onUpload?.(res.data.url, res.data.path);
        } catch (err) {
            const msg = err.response?.data?.message
                || err.response?.data?.errors?.file?.[0]
                || 'Upload failed. Check your S3 credentials and bucket config.';
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    const copy = () => {
        if (result?.url) {
            navigator.clipboard.writeText(result.url);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="flex-1 text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={(e) => {
                        setFile(e.target.files[0] || null);
                        setResult(null);
                        setError('');
                    }}
                />
                <button
                    type="button"
                    onClick={upload}
                    disabled={!file || uploading}
                    className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                    {uploading ? 'Uploading…' : label}
                </button>
            </div>

            {result && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1.5">
                    <p className="text-xs font-semibold text-emerald-700">Uploaded successfully</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={result.url}
                            onClick={(e) => e.target.select()}
                            className="flex-1 rounded border border-emerald-300 bg-white px-2 py-1 text-xs text-gray-700 font-mono"
                        />
                        <button
                            type="button"
                            onClick={copy}
                            className="shrink-0 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                            Copy
                        </button>
                        <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                            Open
                        </a>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
