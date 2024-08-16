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
import { KeyIcon, Cog6ToothIcon, ArrowDownTrayIcon } from '@heroicons/react/20/solid';
import { credentials, settings } from '../wailsjs/go/models'
import { GetSettings, ListCredentials } from '../wailsjs/go/main/App'


// Define the context type
type CredentialsContextType = {
  credentials: any[]; // Replace 'any' with a more specific type if possible
  setCredentials: React.Dispatch<React.SetStateAction<credentials.Credential[]>>;
  refreshCredentials: () => Promise<void>;
};

// Define the context type
type SettingsContextType = {
    settings: any; // Replace 'any' with a more specific type if possible
    setSettings: React.Dispatch<React.SetStateAction<settings.Settings>>;
    refreshSettings: () => Promise<void>;
};

// Create the context with the correct type
export const CredentialsContext = createContext<CredentialsContextType | null>(null);
export const SettingsContext = createContext<SettingsContextType | null>(null);

function SidebarContent() {
    const navigate = useNavigate();
    return (
        <Sidebar>
            <SidebarHeader>
                <img src={logo} alt="Logo" className="h-8 w-auto" />
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
    const [settings, setSettings] = useState<any>({});
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

    const fetchSettings = async () => {
        try {
            const data = await GetSettings()
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const refreshSettings = async () => {
        await fetchSettings();
    };

    useEffect(() => {
        // Fetch credentials when the route changes
        if (location.pathname === '/') {
            fetchCredentials();
        }
        // Fetch settings when the route changes
        if (location.pathname === '/settings') {
            fetchSettings();
        }
    }, [location]);

    const navbarContent = (
        <Navbar>
        </Navbar>
    );

    return (
        <CredentialsContext.Provider value={{ credentials, setCredentials, refreshCredentials }}>
        <SettingsContext.Provider value={{ settings, setSettings, refreshSettings }}>
            <SidebarLayout
                sidebar={<SidebarContent />}
                navbar={navbarContent}
            >
                <div id="App">
                    <Routes>
                        <Route path="/" element={<Credentials />} />
                        <Route path="/credentials/:id" element={<CredentialDetails />} />
                        <Route path="/download" element={<DownloadFile />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </div>
            </SidebarLayout>
        </SettingsContext.Provider>
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
