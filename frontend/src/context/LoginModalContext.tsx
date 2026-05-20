import { createContext, useContext, useState, type ReactNode } from "react";

interface LoginModalContextType {
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(
  undefined,
);

export const LoginModalProvider = ({ children }: { children: ReactNode }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <LoginModalContext.Provider
      value={{
        showLoginModal,
        openLoginModal: () => setShowLoginModal(true),
        closeLoginModal: () => setShowLoginModal(false),
      }}
    >
      {children}
    </LoginModalContext.Provider>
  );
};

export const useLoginModal = () => {
  const ctx = useContext(LoginModalContext);
  if (!ctx)
    throw new Error("useLoginModal must be used within LoginModalProvider");
  return ctx;
};
