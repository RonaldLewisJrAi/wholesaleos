import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
    initialColorMode: "dark",
    useSystemColorMode: false,
};

const theme = extendTheme({
    config,
    colors: {
        brand: {
            900: "#050816",
            800: "#0B1F33",
            700: "#121A3A",
            600: "#2A4BFF",
            500: "#4E7BFF"
        }
    },

    styles: {
        global: {
            body: {
                bg: "#050816",
                color: "white"
            }
        }
    },

    radii: {
        card: "16px"
    },

    shadows: {
        card: "0 0 25px rgba(78,123,255,0.25)"
    }
});

export default theme;
