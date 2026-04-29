import { useEffect, useState } from 'react';

export default function GuestLayout({ children }) {
    const localBg = '/storage/bg.jpg';
    const remoteBg = 'https://ariyamaan.com/assets/images/General_Login%20Screen_01.jpg';
    const [bgUrl, setBgUrl] = useState(localBg);

    useEffect(() => {
        const img = new Image();
        img.onload = () => setBgUrl(localBg);
        img.onerror = () => setBgUrl(remoteBg);
        img.src = localBg;
    }, []);

    const bgStyle = {
        backgroundImage: `url('${bgUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
            <div className="w-full overflow-hidden bg-white/80 px-6 py-4 shadow-md sm:max-w-sm sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
