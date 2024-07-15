import { useState, useContext } from 'react'
import { CredentialsContext } from '../App'
import { Button } from '../components/catalyst/button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from '../components/catalyst/dialog'
import { Field, FieldGroup, Label } from '../components/catalyst/fieldset'
import { Input } from '../components/catalyst/input'
import { ClipboardIcon } from '@heroicons/react/24/outline'
import { credentials } from "../../wailsjs/go/models";
import { AddCredential } from "../../wailsjs/go/main/App";
import { decode } from 'light-bolt11-decoder';




export function AddCredentialModal() {
  const { refreshCredentials } = useContext(CredentialsContext)!
  const [isOpen, setIsOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [macaroon, setMacaroon] = useState('')
  const [invoice, setInvoice] = useState('')
  const [preimage, setPreimage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState('')

  const setTrimmedUrl = (value: string) => setUrl(value.trim())
  const setTrimmedPreimage = (value: string) => setPreimage(value.trim())

  const handleUrlSubmit = async () => {
    setIsLoading(true)
    setError('')

    
    // if (url === "https://api.fewsats.com/v0/storage/download/f656f47e-292b-473d-b614-1b88ba83e0d4") {
    //   setMacaroon('')      
    //   setInvoice('lnbc100n1png79ywpp5k0yc30m6sww36qvfmayxcf64qc4ja7hptfxxvm4zla729dq99xksdq8f3f5z4qcqzzsxqyz5vqsp5s20ks3085n44gpme0vd23cj5c6upfl2tdgm0s8efw2hf0u7c6avs9qyyssqqgg9mmvn4nxtdhsz7253d8qs8j7yyxrj9r4e4dpusa9uys4dree5wsxkfdr6u9l5v8er0n0g2un0mx03zrt3fxv8fwdsl85cwuvnl7sphydxjn')
    //   setIsLoading(false)
    //   return
    // }
    
    try {
      // Make API call to handle L402 errors and retrieve macaroon/invoice
      const response = await fetch(url, {method: 'GET'})
      if (response.status === 402) {
        const wwwAuthenticateHeader = response.headers.get('WWW-Authenticate')
        if (wwwAuthenticateHeader) {
            const [macaroon, invoice] = parseWWWAuthenticateHeader(wwwAuthenticateHeader)
            setMacaroon(macaroon)
            setInvoice(invoice)
          } else {
            throw new Error('Missing WWW-Authenticate header')
          }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (err) {
      setError('Failed to retrieve macaroon and invoice')
    }

    setIsLoading(false)
  }

  function parseWWWAuthenticateHeader(header: string): [string, string] {
    const macaroonMatch = header.match(/macaroon="([^"]*)"/)
    const invoiceMatch = header.match(/invoice="([^"]*)"/)
    
    if (!macaroonMatch || !invoiceMatch) {
      throw new Error('Invalid WWW-Authenticate header format')
    }
  
    return [macaroonMatch[1], invoiceMatch[1]]
  }

  const handleSaveCredentials = () => {
    // Trim the label only when saving
    const trimmedLabel = label.trim()
    
    // Validate preimage against invoice hash
    validatePreimage(invoice, preimage)
      .then((isValid) => {
        if (!isValid) {
          setError('Invalid preimage');
          return;
        }

        // Create a new Credential object with trimmed label
        const cred = new credentials.Credential({
          label: trimmedLabel,
          location: url,
          macaroon: macaroon,
          invoice: invoice,
          preimage: preimage,
          // Note: id and created_at will be set by the backend
        });

        // Use the newCredential object with your AddCredential function
        AddCredential(cred)
        .then(() => {
          console.log('Credentials saved:', cred);
          // Refresh the credentials from the database
          refreshCredentials();
          setIsOpen(false);
        })
        .catch((err) => {
          console.error('Error saving credentials:', err);
          setError('Failed to save credentials');
        });

        // Save credentials logic here
        console.log('Credentials saved:', { url, macaroon, invoice, preimage });
        setIsOpen(false);
      })
      .catch((err) => {
        console.error('Error validating preimage:', err);
        setError('Error validating preimage');
      });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess('Copied!')
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (err) {
      setCopySuccess('Failed to copy')
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>Add Credentials</Button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>Add Credentials</DialogTitle>
        <DialogBody>
          <FieldGroup>
            <Field>
              <Label>Label</Label>
              <Input
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter label"
                autoFocus
              />
            </Field>
            <Field>
              <Label>URL</Label>
              <Input
                name="url"
                value={url}
                onChange={(e) => setTrimmedUrl(e.target.value)}
                placeholder="Enter URL"
              />
            </Field>
            <Field>
              <Label>Macaroon</Label>
              <Input
                name="macaroon"
                value={macaroon}
                disabled
                placeholder="Macaroon will be populated automatically"
              />
            </Field>
            <Field>
              <Label>Invoice</Label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  name="invoice"
                  value={invoice}
                  disabled
                  placeholder="Invoice will be populated automatically"
                  style={{ flexGrow: 1, marginRight: '8px' }}
                />
                <Button
                  onClick={() => copyToClipboard(invoice)}
                  disabled={!invoice}
                  aria-label="Copy invoice"
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <ClipboardIcon className="h-5 w-5" />
                </Button>
              </div>
              {copySuccess && <small style={{ color: 'green' }}>{copySuccess}</small>}
            </Field>
            <Field>
              <Label>Preimage</Label>
              <Input
                name="preimage"
                value={preimage}
                onChange={(e) => setTrimmedPreimage(e.target.value)}
                placeholder="Enter preimage"
              />
            </Field>
          </FieldGroup>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUrlSubmit} disabled={isLoading || !url}>
            {isLoading ? 'Loading...' : 'Fetch Macaroon & Invoice'}
          </Button>
          <Button onClick={handleSaveCredentials} disabled={!label || !macaroon || !invoice || !preimage}>
            Save Credentials
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Keep validatePreimage as an async function
async function validatePreimage(invoice: string, preimage: string): Promise<boolean> {
  try {
    const decoded = decode(invoice)

    // Convert preimage from hex to Uint8Array
    const preimageBuffer = new Uint8Array(preimage.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Hash the preimage using SHA-256
    const calculatedHashBuffer = await crypto.subtle.digest('SHA-256', preimageBuffer);
    const calculatedHash = Array.from(new Uint8Array(calculatedHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare the calculated hash with the provided payment hash
    return calculatedHash === decoded.payment_hash;
  } catch (err) {
    console.error('Error validating preimage:', err);
    return false;
  }
}