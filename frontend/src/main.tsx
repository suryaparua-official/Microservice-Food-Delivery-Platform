import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LoginModalProvider } from "./context/LoginModalContext.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

export const authService = import.meta.env.VITE_AUTH_URL;
export const restaurantService = import.meta.env.VITE_RESTAURANT_URL;
export const utilsService = import.meta.env.VITE_UTILS_URL;
export const realtimeService = import.meta.env.VITE_REALTIME_URL;
export const riderService = import.meta.env.VITE_RIDER_URL;
export const adminService = import.meta.env.VITE_ADMIN_URL;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
        <AppProvider>
          <LoginModalProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </LoginModalProvider>
        </AppProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
