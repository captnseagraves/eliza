import { render as rtlRender } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GlobalErrorBoundary>
            {children}
            <Toaster />
          </GlobalErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: Providers,
    ...options,
  });
}

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { render };
