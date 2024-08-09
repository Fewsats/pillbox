import React, { useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { SaveFile } from '../../wailsjs/go/main/App';

import { Button } from '../components/catalyst/button';
import { Field, Label } from '../components/catalyst/fieldset';
import { Text } from '../components/catalyst/text';
import { Heading } from '../components/catalyst/heading';
import { CredentialsContext } from '../App';
import { Combobox } from '../components/catalyst/combobox';

type Option = {
  id: string;
  name: string;
  details?: {
    url: string;
    l402Credentials: string;
  };
};

export const DownloadFile: React.FC = () => {
  const context = useContext(CredentialsContext);
  if (!context)
    throw new Error(
      'CredentialsContext must be used within a CredentialsProvider'
    );
  const { credentials } = context;

  const options = useMemo(
    () =>
      credentials
        ?.filter((item) => item.type === 'file')
        .map((item) => ({
          id: item.id,
          name: item.label,
          details: {
            url: item.location,
            l402Credentials: `${item.macaroon}:${item.preimage}`,
          },
        })) || [],
    [credentials]
  );

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Option>(
    options.length ? options[0] : { id: '', name: '' }
  );
  const url = useMemo(() => active?.details?.url || '', [active]);
  const l402Credentials = useMemo(
    () => active?.details?.l402Credentials || '',
    [active]
  );

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `L402 ${l402Credentials}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      let filename = url.split('/').pop() || 'download';
      const contentDisposition = response.headers.get('content-disposition');

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=?(.+)?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim().replace(/["']/g, '');
        }
      }

      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);

      // Use the SaveFile function from your Go backend
      const savedPath = await SaveFile(filename, Array.from(uint8Array));
      toast.success(`File saved successfully to ${savedPath}`);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Download failed. Please try again.');
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className='mx-auto max-w-md p-4'>
      <Heading level={1} className='mb-4'>
        Download File
      </Heading>
      <form onSubmit={handleDownload} className='space-y-4'>
        <Field>
          <Label>File URL:</Label>
          <Combobox
            value={active}
            onChange={(option) => setActive(option)}
            options={options}
            search={true}
            name={'fileUrl'}
          />
        </Field>
        <div className='flex justify-center'>
          <Button type='submit' disabled={isDownloading}>
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </form>
      {isDownloading && (
        <div className='mt-4'>
          <div className='h-2.5 w-full rounded-full bg-gray-200'>
            <div
              className='h-2.5 rounded-full bg-blue-600'
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <Text className='mt-2 text-center'>
            {downloadProgress}% Downloaded
          </Text>
        </div>
      )}
      {error && <Text className='mt-2 text-red-500'>{error}</Text>}
    </div>
  );
};
