import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useRef } from 'react';

const FOLDERS = [
    { value: 'uploads',   label: 'General Uploads' },
    { value: 'children',  label: 'Children' },
    { value: 'gallery',   label: 'Gallery' },
    { value: 'documents', label: 'Documents' },
    { value: 'media',     label: 'Media' },
];

function CopyIcon() {
    return (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );
}

export default function MediaUpload() {
    const [folder, setFolder] = useState('uploads');
    const [customFolder, setCustomFolder] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState([]);
    const [copied, setCopied] = useState(null);
    const inputRef = useRef(null);

    const effectiveFolder = folder === '__custom__' ? customFolder.trim() || 'uploads' : folder;

    const upload = async () => {
        if (!files.length) return;
        setUploading(true);

        const newResults = [];
        for (const file of files) {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', effectiveFolder);
            try {
                const res = await window.axios.post(route('s3.upload'), fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                newResults.push({ name: file.name, url: res.data.url, path: res.data.path, ok: true });
            } catch (err) {
                const msg = err.response?.data?.message
                    || err.response?.data?.errors?.file?.[0]
                    || 'Upload failed';
                newResults.push({ name: file.name, error: msg, ok: false });
            }
        }

        setResults((prev) => [...newResults, ...prev]);
        setFiles([]);
        if (inputRef.current) inputRef.current.value = '';
        setUploading(false);
    };

    const copy = (url, idx) => {
        navigator.clipboard.writeText(url);
        setCopied(idx);
        setTimeout(() => setCopied(null), 2000);
    };

    const clearResults = () => setResults([]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Media Upload</h2>}>
            <Head title="Media Upload" />

            <div className="p-6 max-w-3xl mx-auto space-y-6">

                {/* Upload Card */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 space-y-5">
                    <h3 className="text-sm font-semibold text-gray-700">Upload to S3</h3>

                    {/* Folder selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Destination Folder</label>
                        <div className="flex items-center gap-3">
                            <select
                                className="flex-1 rounded-lg border-gray-300 text-sm shadow-sm"
                                value={folder}
                                onChange={(e) => setFolder(e.target.value)}
                            >
                                {FOLDERS.map((f) => (
                                    <option key={f.value} value={f.value}>{f.label} ({f.value}/)</option>
                                ))}
                                <option value="__custom__">Custom folder…</option>
                            </select>
                            {folder === '__custom__' && (
                                <input
                                    type="text"
                                    placeholder="e.g. my-folder/sub"
                                    className="flex-1 rounded-lg border-gray-300 text-sm shadow-sm"
                                    value={customFolder}
                                    onChange={(e) => setCustomFolder(e.target.value)}
                                />
                            )}
                        </div>
                        <p className="text-xs text-gray-400">
                            Files will be stored under <code className="bg-gray-100 px-1 rounded">{effectiveFolder}/</code> on S3
                        </p>
                    </div>

                    {/* File picker */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Files <span className="text-gray-400 font-normal">(select one or multiple)</span></label>
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                            onChange={(e) => setFiles(Array.from(e.target.files))}
                        />
                        {files.length > 0 && (
                            <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
                                {files.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                        {f.name} <span className="text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Upload button */}
                    <button
                        type="button"
                        onClick={upload}
                        disabled={!files.length || uploading}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                    >
                        {uploading ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Uploading…
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                Upload {files.length > 1 ? `${files.length} files` : 'file'}
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Uploaded Files <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{results.length}</span>
                            </h3>
                            <button type="button" onClick={clearResults} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {results.map((r, i) => (
                                <div key={i} className="px-5 py-3.5">
                                    {r.ok ? (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                                                    <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                                                </span>
                                                <span className="text-sm font-medium text-gray-800 truncate">{r.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 pl-7">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={r.url}
                                                    onClick={(e) => e.target.select()}
                                                    className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-mono text-gray-600 focus:outline-none focus:border-indigo-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => copy(r.url, i)}
                                                    className={`flex items-center gap-1.5 shrink-0 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${copied === i ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    <CopyIcon />
                                                    {copied === i ? 'Copied!' : 'Copy'}
                                                </button>
                                                <a
                                                    href={r.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 rounded border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                                >
                                                    Open
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                                                <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </span>
                                            <span className="text-sm font-medium text-gray-800">{r.name}</span>
                                            <span className="text-xs text-red-500 ml-1">— {r.error}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
