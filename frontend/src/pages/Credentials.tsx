import React, { useContext } from 'react';
import { Heading } from '../components/catalyst/heading';
import { AddCredentialModal } from '../components/AddCredentialModal';
import { PayCredentialModal } from '../components/PayCredentialModal';
import { CredentialsTable } from '../components/CredentialsTable';
import { CredentialsContext, SettingsContext } from '../App';

export function Credentials() {
  const context = useContext(CredentialsContext);
  if (!context)
    throw new Error(
      'CredentialsContext must be used within a CredentialsProvider'
    );
  const { credentials } = context;
  const contextSettings = useContext(SettingsContext);
  if (!contextSettings)
    throw new Error('SettingsContext must be used within a SettingsProvider');
  const { settings } = contextSettings;

  return (
    <div className={'mx-auto max-w-6xl'}>
      <div className='mb-5 flex items-center justify-between gap-4'>
        <Heading>L402 Credentials</Heading>
        <div className={'flex items-center gap-4'}>
          <AddCredentialModal />
          {(settings?.wallet_config || settings?.hub_key) && (
            <PayCredentialModal />
          )}
        </div>
      </div>
      <CredentialsTable credentials={credentials} />
    </div>
  );
}
