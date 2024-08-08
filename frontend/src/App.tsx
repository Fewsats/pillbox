import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import logo from './assets/images/logo-universal.png';
import { Sidebar, SidebarHeader, SidebarBody, SidebarFooter, SidebarItem } from './components/catalyst/sidebar';
import { SidebarLayout } from './components/catalyst/sidebar-layout';
import { Navbar } from './components/catalyst/navbar';
import { Credentials } from './pages/Credentials';
import { CredentialDetails } from './pages/CredentialDetails';
import { DownloadFile } from './pages/DownloadFile';
import { Settings } from './pages/Settings';
import {GraphQL} from "./pages/GraphQL";
import { KeyIcon, Cog6ToothIcon, ArrowDownTrayIcon, CodeBracketIcon } from '@heroicons/react/20/solid';
import { credentials } from '../wailsjs/go/models'
import { ListCredentials } from '../wailsjs/go/main/App'

// Define the context type
type CredentialsContextType = {
  credentials: any[]; // Replace 'any' with a more specific type if possible
  setCredentials: React.Dispatch<React.SetStateAction<credentials.Credential[]>>;
  refreshCredentials: () => Promise<void>;
};

// Create the context with the correct type
export const CredentialsContext = createContext<CredentialsContextType | null>(null);

function SidebarContent() {
    const navigate = useNavigate();
    return (
        <Sidebar>
            <SidebarHeader>
                <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
            </SidebarHeader>
            <SidebarBody>
                <SidebarItem onClick={() => navigate('/')} className="w-full flex items-center">
                    <KeyIcon className="h-5 w-5 mr-2" />
                    <span className="flex-grow">Credentials</span>
                </SidebarItem>
                <SidebarItem onClick={() => navigate('/download')} className="w-full flex items-center">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    <span className="flex-grow">Download File</span>
                </SidebarItem>
                <SidebarItem onClick={() => navigate('/graphql')} className="w-full flex items-center">
                    <CodeBracketIcon className="h-5 w-5 mr-2" />
                    <span className="flex-grow">GraphQL</span>
                </SidebarItem>
            </SidebarBody>
            <SidebarFooter>
                <SidebarItem onClick={() => navigate('/settings')} className="w-full flex items-center">
                    <Cog6ToothIcon className="h-5 w-5 mr-2" />
                    <span className="flex-grow">Settings</span>
                </SidebarItem>
            </SidebarFooter>
        </Sidebar>
    );
}

function AppContent() {
    const [credentials, setCredentials] = useState<any[]>([]);
    const location = useLocation();

    const fetchCredentials = async () => {
        try {
            const data = await ListCredentials()
            setCredentials(data);
        } catch (error) {
            console.error('Error fetching credentials:', error);
        }
    };

    const refreshCredentials = async () => {
        await fetchCredentials();
    };

    useEffect(() => {
        // Fetch credentials when the route changes
        if (location.pathname === '/') {
            fetchCredentials();
        }
    }, [location]);

    const navbarContent = (
        <Navbar>
        </Navbar>
    );

    return (
        <CredentialsContext.Provider value={{ credentials, setCredentials, refreshCredentials }}>
            <SidebarLayout
                sidebar={<SidebarContent />}
                navbar={navbarContent}
            >
                <div id="App">
                    <Routes>
                        <Route path="/" element={<Credentials />} />
                        <Route path="/credentials/:id" element={<CredentialDetails />} />
                        <Route path="/download" element={<DownloadFile />} />
                        <Route path="/graphql" element={<GraphQL />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </div>
            </SidebarLayout>
        </CredentialsContext.Provider>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
