import React, { ReactNode } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "../theme/theme";

interface ThemeProviderProps {
    children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
    return (
        <ChakraProvider theme={theme}>
            {children}
        </ChakraProvider>
    );
}
