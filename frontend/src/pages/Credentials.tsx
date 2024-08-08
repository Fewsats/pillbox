import React, { useContext } from 'react';
import { Heading } from '../components/catalyst/heading'
import { AddCredentialModal } from '../components/AddCredentialModal'
import { CredentialsTable } from '../components/CredentialsTable'
import { CredentialsContext } from '../App';

export function Credentials() {
    const context = useContext(CredentialsContext);
    if (!context) throw new Error("CredentialsContext must be used within a CredentialsProvider");
    const { credentials } = context;

    return (
        <div className={'max-w-6xl mx-auto '}>
            <div className="flex justify-between items-center mb-5">
                <Heading>L402 Credentials</Heading>
                <AddCredentialModal />
            </div>
            <CredentialsTable credentials={credentials} />
        </div>
    );
}
