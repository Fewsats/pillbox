import React, { useContext } from 'react';
import { Heading } from '../components/catalyst/heading';
import { AddCredentialModal } from '../components/AddCredentialModal';
import { CredentialsTable } from '../components/CredentialsTable';
import { CredentialsContext } from '../App';

export function Credentials() {
  const context = useContext(CredentialsContext);
  if (!context)
    throw new Error(
      'CredentialsContext must be used within a CredentialsProvider'
    );
  const { credentials } = context;

  return (
    <div className={'mx-auto max-w-6xl'}>
      <div className='mb-5 flex items-center justify-between'>
        <Heading>L402 Credentials</Heading>
        <AddCredentialModal />
      </div>
      <CredentialsTable credentials={credentials} />
    </div>
  );
}
