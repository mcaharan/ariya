export default function ApplicationLogo(props) {
    return (
        <img
            {...props}
            src={'/storage/logo.png'}
            alt="Ariya"
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://ariyamaan.com/assets/images/logo.png';
            }}
        />
    );
}
