import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import logo from './assets/images/logo-universal.png';
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarItem,
} from './components/catalyst/sidebar';
import { SidebarLayout } from './components/catalyst/sidebar-layout';
import { Navbar } from './components/catalyst/navbar';
import { Credentials } from './pages/Credentials';
import { CredentialDetails } from './pages/CredentialDetails';
import { DownloadFile } from './pages/DownloadFile';
import { Settings } from './pages/Settings';
import { GraphQL } from './pages/GraphQL';
import {
  KeyIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  CodeBracketIcon,
} from '@heroicons/react/20/solid';
import { credentials, settings } from '../wailsjs/go/models';
import { GetSettings, ListCredentials } from '../wailsjs/go/main/App';

// Define the context type
type CredentialsContextType = {
  credentials: credentials.Credential[]; // Replace 'any' with a more specific type if possible
  setCredentials: React.Dispatch<
    React.SetStateAction<credentials.Credential[]>
  >;
  refreshCredentials: () => Promise<void>;
};

// Define the context type
type SettingsContextType = {
  settings: settings.Settings; // Replace 'any' with a more specific type if possible
  setSettings: React.Dispatch<React.SetStateAction<settings.Settings>>;
  refreshSettings: () => Promise<void>;
};

// Create the context with the correct type
export const CredentialsContext = createContext<CredentialsContextType | null>(
  null
);
export const SettingsContext = createContext<SettingsContextType | null>(null);

interface ErrorContextType {
  fetcherError: { errors: { location: any; message: string }[] } | null;
  setFetcherError: React.Dispatch<
    React.SetStateAction<{
      errors: { location: any; message: string }[];
    } | null>
  >;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [fetcherError, setFetcherError] = useState<{
    errors: { location: any; message: string }[];
  } | null>(null);

  return (
    <ErrorContext.Provider value={{ fetcherError, setFetcherError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useErrorContext = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

function SidebarContent() {
  const navigate = useNavigate();
  return (
    <Sidebar>
      <SidebarHeader>
        <img src={logo} alt='Logo' className='h-8 w-auto object-contain' />
      </SidebarHeader>
      <SidebarBody>
        <SidebarItem
          onClick={() => navigate('/')}
          className='flex w-full items-center'
        >
          <KeyIcon className='mr-2 h-5 w-5' />
          <span className='flex-grow'>Credentials</span>
        </SidebarItem>
        <SidebarItem
          onClick={() => navigate('/download')}
          className='flex w-full items-center'
        >
          <ArrowDownTrayIcon className='mr-2 h-5 w-5' />
          <span className='flex-grow'>Download File</span>
        </SidebarItem>
        <SidebarItem
          onClick={() => navigate('/graphql')}
          className='flex w-full items-center'
        >
          <CodeBracketIcon className='mr-2 h-5 w-5' />
          <span className='flex-grow'>GraphQL</span>
        </SidebarItem>
      </SidebarBody>
      <SidebarFooter>
        <SidebarItem
          onClick={() => navigate('/settings')}
          className='flex w-full items-center'
        >
          <Cog6ToothIcon className='mr-2 h-5 w-5' />
          <span className='flex-grow'>Settings</span>
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
      const data = await ListCredentials();
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
      const data = await GetSettings();
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

  const navbarContent = <Navbar></Navbar>;

  return (
    <ErrorProvider>
      <CredentialsContext.Provider
        value={{ credentials, setCredentials, refreshCredentials }}
      >
        <SettingsContext.Provider
          value={{ settings, setSettings, refreshSettings }}
        >
          <SidebarLayout sidebar={<SidebarContent />} navbar={navbarContent}>
            <div id='App'>
              <Routes>
                <Route path='/' element={<Credentials />} />
                <Route
                  path='/credentials/:id'
                  element={<CredentialDetails />}
                />
                <Route path='/download' element={<DownloadFile />} />
                <Route path='/graphql' element={<GraphQL />} />
                <Route path='/settings' element={<Settings />} />
              </Routes>
            </div>
          </SidebarLayout>
        </SettingsContext.Provider>
      </CredentialsContext.Provider>
    </ErrorProvider>
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
