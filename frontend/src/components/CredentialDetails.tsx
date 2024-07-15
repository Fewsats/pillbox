import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heading, Subheading } from './catalyst/heading'
import { Button } from './catalyst/button'
import { Badge } from './catalyst/badge'
import { DescriptionList, DescriptionTerm, DescriptionDetails } from './catalyst/description-list'
import { Divider } from './catalyst/divider'
import { Link } from './catalyst/link'
import { credentials } from '../../wailsjs/go/models'
import { GetCredential } from '../../wailsjs/go/main/App'
import { ChevronLeftIcon, GlobeAltIcon, CalendarIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/16/solid'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Details() {
  const [credential, setCredential] = useState<credentials.Credential | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    const fetchCredential = async () => {
      if (id) {
        try {
          const fetchedCredential = await GetCredential(parseInt(id))
          setCredential(fetchedCredential)
        } catch (error) {
          console.error('Error fetching credential:', error)
        }
      }
    }
    fetchCredential()
  }, [id])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedField(field)
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} copied to clipboard`);
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
        toast.error('Failed to copy to clipboard');
      })
  }

  if (!credential) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl"> 
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-white">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          Back to Credentials
        </Link>
      </div>
      <div className="overflow-hidden sm:rounded-lg w-full">
        <div className="px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <Heading className="text-3xl font-bold text-gray-900 dark:text-white">Credential #{credential.id}</Heading>
            <Badge color="lime" className="text-sm font-semibold">Active</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center mr-6">
              <GlobeAltIcon className="w-5 h-5 mr-2" />
              {credential.location}
            </span>
            <span className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              {new Date(credential.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-5 sm:px-8">
          <div className="flex justify-between items-center mb-6">
            <Subheading className="text-xl font-medium text-gray-900 dark:text-white">Credential Details</Subheading>
            <Button
              onClick={() => copyToClipboard(`${credential.macaroon}:${credential.preimage}`, 'credentials')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <ClipboardIcon className="h-5 w-5 mr-2" />
              {copiedField === 'credentials' ? "Copied!" : "Copy Credentials"}
            </Button>
          </div>
          <Divider className="mb-6" />
          <DescriptionList className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2">
            <div>
              <DescriptionTerm className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">ID</DescriptionTerm>
              <DescriptionDetails className="text-base text-gray-900 dark:text-white">{credential.id}</DescriptionDetails>
            </div>
            <div>
              <DescriptionTerm className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">URL</DescriptionTerm>
              <DescriptionDetails 
                className="text-base text-gray-900 dark:text-white cursor-pointer flex items-center"
                onClick={() => copyToClipboard(credential.location, 'url')}
              >
                {credential.location}
                {copiedField === 'url' && <CheckIcon className="h-5 w-5 ml-2 text-green-500" />}
              </DescriptionDetails>
            </div>
            <div>
              <DescriptionTerm className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Macaroon</DescriptionTerm>
              <DescriptionDetails 
                className="text-base text-gray-900 dark:text-white truncate cursor-pointer flex items-center"
                onClick={() => copyToClipboard(credential.macaroon, 'macaroon')}
              >
                {credential.macaroon}
                {copiedField === 'macaroon' && <CheckIcon className="h-5 w-5 ml-2 text-green-500" />}
              </DescriptionDetails>
            </div>
            <div>
              <DescriptionTerm className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Preimage</DescriptionTerm>
              <DescriptionDetails 
                className="text-base text-gray-900 dark:text-white truncate cursor-pointer flex items-center"
                onClick={() => copyToClipboard(credential.preimage, 'preimage')}
              >
                {credential.preimage}
                {copiedField === 'preimage' && <CheckIcon className="h-5 w-5 ml-2 text-green-500" />}
              </DescriptionDetails>
            </div>
            <div>
              <DescriptionTerm className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Invoice</DescriptionTerm>
              <DescriptionDetails 
                className="text-base text-gray-900 dark:text-white truncate cursor-pointer flex items-center"
                onClick={() => copyToClipboard(credential.invoice, 'invoice')}
              >
                {credential.invoice}
                {copiedField === 'invoice' && <CheckIcon className="h-5 w-5 ml-2 text-green-500" />}
              </DescriptionDetails>
            </div>
            <div>
              <DescriptionTerm className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created at</DescriptionTerm>
              <DescriptionDetails className="text-base text-gray-900 dark:text-white">{new Date(credential.created_at).toLocaleString()}</DescriptionDetails>
            </div>
          </DescriptionList>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}