import { createContext, useContext } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from './AuthContext';

const WSContext = createContext(null);

export const WSProvider = ({ children }) => {
    const { user } = useAuth();
    const { sendMessage, lastMessage, wsStatus } = useWebSocket(user?.token);

    return (
        <WSContext.Provider value={{ sendMessage, lastMessage, wsStatus }}>
            {children}
        </WSContext.Provider>
    );
};

export const useWS = () => useContext(WSContext);
