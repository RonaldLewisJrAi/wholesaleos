/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#4f46e5',
                'primary-hover': '#4338ca',
                secondary: '#10b981',
                'secondary-hover': '#059669',

                // New Brand Colors (WholesaleOS + Vision UI)
                'vision-navy': '#0B1F33',
                'vision-emerald': '#19A974',
                'vision-gold': '#F2B705',
                'vision-slate': '#2E3A46',

                dark: '#0a0a0c',
                surface: '#22252e',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'soft-elevation': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            borderRadius: {
                'vision': '8px',
            }
        },
    },
    plugins: [],
}
