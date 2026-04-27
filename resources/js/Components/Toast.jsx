import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const { flash } = usePage().props;

    const show = useCallback((msg, ok = true) => {
        setToast({ msg, ok });
    }, []);

    useEffect(() => {
        if (flash?.success) show(flash.success, true);
        if (flash?.error)   show(flash.error,   false);
    }, [flash]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    return (
        <ToastCtx.Provider value={show}>
            {children}
            {toast && (
                <div
                    key={toast.msg + Date.now()}
                    className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in-up ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}
                >
                    {toast.ok
                        ? <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                        : <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    }
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            )}
        </ToastCtx.Provider>
    );
}

export const useToast = () => useContext(ToastCtx);
