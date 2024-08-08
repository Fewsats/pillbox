import React, { useState, useEffect, useCallback } from 'react';
import { Heading } from '../components/catalyst/heading';

import { GraphiQL } from 'graphiql';
import type { Fetcher } from '@graphiql/toolkit';
import 'graphiql/graphiql.min.css';
import {Button} from "../components/catalyst/button";
import {Fieldset, Label} from "../components/catalyst/fieldset";
import {Input} from "../components/catalyst/input";

export const GraphQL: React.FC = () => {
  const [queryUrl, setQueryUrl] = useState('');
  // const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState('');
  const [isValidCredentials, setIsValidCredentials] = useState(false);
  const [status, setStatus] = useState<{ message: string; ok: boolean } | null>(null);

  useEffect(() => {
    const isValid = /^[^:]+:[^:]+$/.test(credentials.trim());
    setIsValidCredentials(isValid);
  }, [credentials]);

  const handleQueryUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryUrl(e.target.value);
    setStatus(null);
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(e.target.value);
    setStatus(null);
  };

  const fetcher: Fetcher = useCallback(async (graphQLParams) => {
    if (!credentials) {
      console.log('No L402 credentials provided');
      return Promise.resolve({ data: null });
    }

    if (!queryUrl) {
      console.log('No queryUrl provided');
      return Promise.resolve({ data: null });
    }

    try {
      console.log('Fetching from queryUrl:', queryUrl);
      let response;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (isValidCredentials) {
        const [macaroon, preimage] = credentials.split(':');
        headers['Authorization'] = `L402 ${macaroon}:${preimage}`;
      }

      response = await fetch(queryUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(graphQLParams),
      });

      console.log('Fetch response status:', response.status);
      if (response.ok) {
        setStatus({ message: `${response.status} OK`, ok: true });
      } else if (response.status === 402) {
        setStatus({ message: '402 Payment Required', ok: false });
        window.open(`http://app.paywithhub.com/purchases?l402_queryUrl=${encodeURIComponent(queryUrl)}`, '_blank')
        throw new Error('Payment required');
      } else {
        setStatus({ message: `${response.status} ${response.statusText}`, ok: false });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Fetcher received result:', result);

      if (result.errors) {
        console.error('GraphQL errors in response:', result.errors);
      }

      return result;
    } catch (error) {
      console.error('Fetcher error:', error);
      throw error;
    }
  }, [queryUrl, credentials, isValidCredentials]);

  return (
    <div className="max-w-[1920px] mx-auto  mx-auto p-4">
      <Heading level={1} className="mb-4 px-4 ">GraphQL Explorer</Heading>

      <div className="flex-1 overflow-hidden">
        <div className="graphiql-session-header py-2 px-4 flex items-start border-b border-gray-200 gap-4">
          <Fieldset className={'flex items-center flex-1 gap-4'}>
            <Label htmlFor="queryUrl" className={'flex-shrink-0'}>Query URL:</Label>
            <Input
                id="queryUrl"
                type="text"
                value={queryUrl}
                onChange={handleQueryUrlChange}
                placeholder="https://api.example.com/graphql"
                className={'!mt-0'}
            />
          </Fieldset>
          <Fieldset className={'flex items-center flex-1 gap-4'}>
            <Label htmlFor="l402" className={'flex-shrink-0'}>L402 Credentials:</Label>
            <Input
                id="l402"
                type="text"
                value={credentials}
                onChange={handleCredentialsChange}
                placeholder="macaroon:preimage"
                className={'!mt-0'}
            />
          </Fieldset>
          <Button type="button" onClick={() => window.open(`http://app.paywithhub.com/purchases?l402_queryUrl=${encodeURIComponent(queryUrl)}`, '_blank')}>
            Pay with Hub
          </Button>
        </div>
        {status && (
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: status.ok ? 'green' : 'red',
              marginRight: '16px'
            }}>
                {status.message}
              </span>
        )}
        <div style={{ flex: 1, overflow: 'auto', height: 'calc(100vh - 240px)' }}>
          <GraphiQL fetcher={fetcher} />
        </div>
      </div>
    </div>
  );
};
