import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heading, Subheading } from './catalyst/heading';
import { Button } from './catalyst/button';
import { Badge } from './catalyst/badge';
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from './catalyst/description-list';
import { Divider } from './catalyst/divider';
import { Link } from './catalyst/link';
import { credentials } from '../../wailsjs/go/models';
import { GetCredential } from '../../wailsjs/go/main/App';
import {
  ChevronLeftIcon,
  GlobeAltIcon,
  CalendarIcon,
  ClipboardIcon,
  CheckIcon,
} from '@heroicons/react/16/solid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Details() {
  const [credential, setCredential] = useState<credentials.Credential | null>(
    null
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchCredential = async () => {
      if (id) {
        try {
          const fetchedCredential = await GetCredential(parseInt(id));
          setCredential(fetchedCredential);
        } catch (error) {
          console.error('Error fetching credential:', error);
        }
      }
    };
    fetchCredential();
  }, [id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedField(field);
        toast.success(
          `${field.charAt(0).toUpperCase() + field.slice(1)} copied to clipboard`
        );
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  const renderMultilineField = (value: string) => {
    return (
      <pre className='w-full whitespace-pre-wrap break-words bg-transparent text-sm text-gray-900 dark:text-white'>
        {value}
      </pre>
    );
  };

  if (!credential) return <div>Loading...</div>;

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      <div className='mb-6'>
        <Link
          href='/'
          className='inline-flex items-center text-sm font-medium text-white'
        >
          <ChevronLeftIcon className='mr-1 h-5 w-5' />
          Back to Credentials
        </Link>
      </div>
      <div className='w-full overflow-hidden sm:rounded-lg'>
        <div className='px-6 py-5 sm:px-8'>
          <div className='flex items-center justify-between'>
            <Heading className='text-3xl font-bold text-gray-900 dark:text-white'>
              {credential.label} (#{credential.id})
            </Heading>
            <Badge color='lime' className='text-sm font-semibold'>
              Active
            </Badge>
          </div>
          <div className='mt-3 flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400'>
            <span className='mr-6 flex items-center'>
              <GlobeAltIcon className='mr-2 h-5 w-5' />
              {credential.location}
            </span>
            <span className='flex items-center'>
              <CalendarIcon className='mr-2 h-5 w-5' />
              {new Date(credential.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        <div className='border-t border-gray-200 px-6 py-5 sm:px-8 dark:border-gray-700'>
          <div className='mb-6 flex items-center justify-between'>
            <Subheading className='text-xl font-medium text-gray-900 dark:text-white'>
              Credential Details
            </Subheading>
            <Button
              onClick={() =>
                copyToClipboard(
                  `${credential.macaroon}:${credential.preimage}`,
                  'credentials'
                )
              }
              className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            >
              <ClipboardIcon className='mr-2 h-5 w-5' />
              {copiedField === 'credentials' ? 'Copied!' : 'Copy Credentials'}
            </Button>
          </div>
          <Divider className='mb-6' />
          <DescriptionList className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2'>
            <div>
              <DescriptionTerm className='mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'>
                ID
              </DescriptionTerm>
              <DescriptionDetails className='text-base text-gray-900 dark:text-white'>
                {credential.id}
              </DescriptionDetails>
            </div>
            <div>
              <DescriptionTerm className='mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'>
                URL
              </DescriptionTerm>
              <DescriptionDetails
                className='flex cursor-pointer items-center text-base text-gray-900 dark:text-white'
                onClick={() => copyToClipboard(credential.location, 'url')}
              >
                {credential.location}
                {copiedField === 'url' && (
                  <CheckIcon className='ml-2 h-5 w-5 text-green-500' />
                )}
              </DescriptionDetails>
            </div>
            <div>
              <DescriptionTerm className='mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'>
                Macaroon
              </DescriptionTerm>
              {renderMultilineField(credential.macaroon)}
            </div>
            <div>
              <DescriptionTerm className='mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'>
                Preimage
              </DescriptionTerm>
              {renderMultilineField(credential.preimage)}
            </div>
            <div>
              <DescriptionTerm className='mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'>
                Invoice
              </DescriptionTerm>
              {renderMultilineField(credential.invoice)}
            </div>
            <div>
              <DescriptionTerm className='mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'>
                Created at
              </DescriptionTerm>
              <DescriptionDetails className='text-base text-gray-900 dark:text-white'>
                {new Date(credential.created_at).toLocaleString()}
              </DescriptionDetails>
            </div>
          </DescriptionList>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
