import React, { useState, useEffect, useContext } from 'react';
import { UpdateSettings, Version } from '../../wailsjs/go/main/App';

import { Heading, Subheading } from '../components/catalyst/heading';
import { Divider } from '../components/catalyst/divider';
import { Text } from '../components/catalyst/text';
import { Field, FieldGroup, Label } from '../components/catalyst/fieldset';
import { Input } from '../components/catalyst/input';
import { Button } from '../components/catalyst/button';
import { SettingsContext } from '../App';
import { BoltSlashIcon, BoltIcon } from '@heroicons/react/24/outline';
import {
  init,
  disconnect,
  onConnected,
  onDisconnected,
  launchModal,
  onModalClosed,
  closeModal,
  getConnectorConfig,
} from '@getalby/bitcoin-connect-react';

import { ToastContainer } from 'react-toastify';

export function Settings() {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error('SettingsContext must be used within a SettingsProvider');
  const { settings } = context;
  const { refreshSettings } = useContext(SettingsContext)!;
  const [version, setVersion] = useState<string>('');
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [values, setValues] = useState<{
    openaiKey: string;
    hubKey: string;
  }>({
    openaiKey: settings?.openai_key || '',
    hubKey: settings?.hub_key || '',
  });
  const [error, setError] = useState('');
  const [walletConfig, setWalletConfig] = useState(
    settings?.wallet_config || undefined
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      init({
        appName: 'Fewsats Pillbox',
        // @ts-ignore
        filters: ['nostr'],
      });
    }

    Version().then(setVersion);

    onConnected((provider) => {
      console.log('provider', provider);
      const config = getConnectorConfig();
      console.log('config', config);
      setWalletConfig(config);
    });

    onDisconnected(() => {
      setWalletConfig(undefined);
    });

    onModalClosed(() => {});

    return () => {
      closeModal();
    };
  }, []);

  useEffect(() => {
    if (
      JSON.stringify(settings.wallet_config) !==
      JSON.stringify(walletConfig || null)
    ) {
      handleSaveSettings();
    }
  }, [walletConfig, values]);

  useEffect(() => {
    setValues({
      openaiKey: settings?.openai_key || '',
      hubKey: settings?.hub_key || '',
    });

    setWalletConfig(settings?.wallet_config || undefined);
  }, [settings]);

  const handleSaveSettings = () => {
    // Create a new Settings object with trimmed openai_key
    const data = {
      openai_key: values.openaiKey.trim(),
      hub_key: values.hubKey.trim(),
      wallet_config: walletConfig || null,
    };

    // @ts-ignore
    UpdateSettings(data)
      .then(() => {
        // Refresh the settings from the database
        refreshSettings();
        setHasChanged(false);
      })
      .catch((err: any) => {
        console.error('Error saving credentials:', err);
        setError('Failed to save credentials');
      });
  };

  const handleInputChange =
    (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({
        ...values,
        [name]: event.target.value,
      });

      if (!hasChanged) {
        setHasChanged(true);
      }
    };

  const handleConnectWallet = async () => {
    launchModal();
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  return (
    <div className='mx-auto max-w-4xl'>
      <Heading>Settings</Heading>
      <Divider className='my-10 mt-6' />

      <section className='grid gap-x-8 gap-y-6 sm:grid-cols-2'>
        <div className='space-y-1'>
          <Subheading>Version</Subheading>
          <Text>The version of the application.</Text>
        </div>
        <div>
          <Text>{version}</Text>
        </div>
      </section>

      <Divider className='my-10' soft />

      <div className={'space-y-4'}>
        <FieldGroup className={'space-y-4'}>
          <Field>
            <Label>OpenAI API Key</Label>
            <Input
              name='openaiKey'
              value={values.openaiKey}
              onChange={handleInputChange('openaiKey')}
              placeholder='Enter OpenAI API Key'
            />
          </Field>
          <Field>
            <Label>PayWithHub API Key</Label>
            <Input
              name='hubKey'
              value={values.hubKey}
              onChange={handleInputChange('hubKey')}
              placeholder='Enter PayWithHub API Key'
            />
          </Field>
        </FieldGroup>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <Button onClick={handleSaveSettings} disabled={!hasChanged}>
          Save Settings
        </Button>
      </div>

      <Divider className='my-10' soft />

      <section className='flex flex-col gap-x-8 gap-y-4 sm:grid-cols-2'>
        <div className={'grid gap-x-8 gap-y-6 sm:grid-cols-2'}>
          <div className='space-y-1'>
            <Subheading>Wallet</Subheading>
            <Text>
              {walletConfig ? 'Wallet is connected' : 'Wallet is not connected'}
            </Text>
          </div>
          <div>
            <Text>
              {walletConfig ? (
                <BoltIcon
                  className={'h-5 w-5 text-zinc-500 dark:text-zinc-400'}
                />
              ) : (
                <BoltSlashIcon
                  className={'h-5 w-5 text-zinc-500 dark:text-zinc-400'}
                />
              )}
            </Text>
          </div>
        </div>
        <div className={'flex gap-4'}>
          <Button onClick={handleConnectWallet}>
            {walletConfig
              ? 'Open your Lightning Wallet'
              : 'Connect your Lightning Wallet'}
          </Button>
          {walletConfig && (
            <Button onClick={handleDisconnectWallet}>Disconnect</Button>
          )}
        </div>
      </section>
      <ToastContainer />
    </div>
  );
}
