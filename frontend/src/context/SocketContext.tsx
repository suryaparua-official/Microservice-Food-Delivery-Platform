import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppData } from "./AppContext";
import { realtimeService } from "../main";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth, user } = useAppData();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuth || !user) {
      setSocket(null);
      return;
    }

    const newSocket = io(realtimeService, {
      auth: {
        token: localStorage.getItem("token"),
      },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket Connected", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket Disconnected");
    });

    newSocket.on("connect_error", (err) => {
      console.log("Socket Error:", err.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAuth, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
