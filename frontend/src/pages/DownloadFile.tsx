import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SaveFile, GetDownloadsPath } from "../../wailsjs/go/main/App";

import { Button } from '../components/catalyst/button';
import { Field, Label } from '../components/catalyst/fieldset'
import { Text } from '../components/catalyst/text';
import { Input } from '../components/catalyst/input'
import { Heading } from '../components/catalyst/heading';

export const DownloadFile: React.FC = () => {
  const [url, setUrl] = useState('');
  const [l402Credentials, setL402Credentials] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `L402 ${l402Credentials}`,
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
    <div className="max-w-md mx-auto p-4">
      <Heading level={1} className="mb-4">Download File</Heading>
      <form onSubmit={handleDownload} className="space-y-4">
        <Field>
          <Label htmlFor="url">File URL:</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </Field>
        <Field>
          <Label htmlFor="l402">L402 Credentials:</Label>
          <Input
            id="l402"
            type="text"
            value={l402Credentials}
            onChange={(e) => setL402Credentials(e.target.value)}
            required
          />
        </Field>
        <div className="flex justify-center">
          <Button type="submit" disabled={isDownloading}>
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </form>
      {isDownloading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <Text className="text-center mt-2">{downloadProgress}% Downloaded</Text>
        </div>
      )}
      {error && <Text className="text-red-500 mt-2">{error}</Text>}
    </div>
  );
};