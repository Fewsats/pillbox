import { useState, useContext, useMemo, Fragment } from 'react';
import { CredentialsContext, SettingsContext } from '../App';
import { Button } from '../components/catalyst/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from '../components/catalyst/dialog';
import { Field, FieldGroup, Label } from '../components/catalyst/fieldset';
import { Input } from '../components/catalyst/input';
import { Combobox } from '../components/catalyst/combobox';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { decode } from 'light-bolt11-decoder';
import apiClient from '../services/apiClient';
import {
  METHOD_OPTIONS,
  PAYMENT_OPTIONS,
  TYPE_OPTIONS,
} from '../constants/options';
import { toast } from 'react-toastify';
import { init, launchPaymentModal } from '@getalby/bitcoin-connect-react';
import { credentials } from '../../wailsjs/go/models';
import { AddCredential } from '../../wailsjs/go/main/App';
import { Divider } from './catalyst/divider';

type Option = {
  name: string;
  id: string | number;
};

export function PayCredentialModal() {
  const { refreshCredentials } = useContext(CredentialsContext)!;
  const { settings } = useContext(SettingsContext)!;
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [macaroon, setMacaroon] = useState('');
  const [invoice, setInvoice] = useState('');
  const [preimage, setPreimage] = useState('');

  const availableMethods = useMemo(() => {
    let methods = [];
    if (settings?.hub_key) {
      methods.push('hub');
    }
    if (settings?.wallet_config) {
      methods.push('wallet');
    }

    return methods;
  }, [settings]);
  const PAYMENT_OPTIONS_FILTERED = useMemo(
    () =>
      PAYMENT_OPTIONS.filter((option) => availableMethods.includes(option.id)),
    [availableMethods]
  );

  const [payment, setPayment] = useState<Option>(PAYMENT_OPTIONS_FILTERED[0]);
  const [type, setType] = useState<Option>(TYPE_OPTIONS[0]);
  const [method, setMethod] = useState<Option>(METHOD_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const setTrimmedUrl = (value: string) => setUrl(value.trim());
  const setTrimmedPreimage = (value: string) => setPreimage(value.trim());

  const handleUrlSubmit = async () => {
    setError('');

    // if (url === "https://api.fewsats.com/v0/storage/download/f656f47e-292b-473d-b614-1b88ba83e0d4") {
    //   setMacaroon('')
    //   setInvoice('lnbc100n1png79ywpp5k0yc30m6sww36qvfmayxcf64qc4ja7hptfxxvm4zla729dq99xksdq8f3f5z4qcqzzsxqyz5vqsp5s20ks3085n44gpme0vd23cj5c6upfl2tdgm0s8efw2hf0u7c6avs9qyyssqqgg9mmvn4nxtdhsz7253d8qs8j7yyxrj9r4e4dpusa9uys4dree5wsxkfdr6u9l5v8er0n0g2un0mx03zrt3fxv8fwdsl85cwuvnl7sphydxjn')
    //   setIsLoading(false)
    //   return
    // }

    let data: { macaroon?: string; invoice?: string } = {};

    try {
      // Make API call to handle L402 errors and retrieve macaroon/invoice
      const response = await fetch(url, { method: 'GET' });
      if (response.status === 402) {
        const wwwAuthenticateHeader = response.headers.get('WWW-Authenticate');
        if (wwwAuthenticateHeader) {
          const [macaroon, invoice] = parseWWWAuthenticateHeader(
            wwwAuthenticateHeader
          );
          setMacaroon(macaroon);
          setInvoice(invoice);

          data = { macaroon, invoice };
        } else {
          throw new Error('Missing WWW-Authenticate header');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      setError('Failed to retrieve macaroon and invoice');
    }

    return data;
  };

  const handlePay = async () => {
    setIsLoading(true);

    const { macaroon, invoice } = await handleUrlSubmit();

    if (payment.id === 'wallet') {
      if (macaroon && invoice) {
        launchPaymentModal({
          invoice,
          paymentMethods: 'internal',
          onPaid: async ({ preimage }: { preimage: string }) => {
            setPreimage(preimage);

            setSubmitting(false);
            toast.success('Successful payment!');
            setIsLoading(false);
          },
          onCancelled: () => {
            setSubmitting(false);
            toast.error('Payment failed');
            setIsLoading(false);
          },
        });
      }
    }

    if (payment.id === 'hub') {
      const data = {
        l402_url: url,
      };

      const HUB_API_KEY = settings?.hub_key;

      const response = await apiClient
        .post(`/v0/l402/preview/purchase`, data, {
          headers: {
            Authorization: 'Token ' + HUB_API_KEY,
            Accept: 'application/json',
          },
        })
        .catch((e) => {
          console.log('error', e);
          toast.error('Payment failed');
          setIsLoading(false);
          setSubmitting(false);
        });
      console.log('response', response);
      toast.success('Successful payment!');
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  function parseWWWAuthenticateHeader(header: string): [string, string] {
    const macaroonMatch = header.match(/macaroon="([^"]*)"/);
    const invoiceMatch = header.match(/invoice="([^"]*)"/);

    if (!macaroonMatch || !invoiceMatch) {
      throw new Error('Invalid WWW-Authenticate header format');
    }

    return [macaroonMatch[1], invoiceMatch[1]];
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed to copy');
    }
  };

  const handleSaveCredentials = async () => {
    // Trim the label only when saving
    const trimmedLabel = label.trim();

    let isValid = true;

    if (invoice) {
      // Validate preimage against invoice hash
      isValid = !!(await validatePreimage(invoice, preimage).catch((err) => {
        console.error('Error validating preimage:', err);
        setError('Error validating preimage');
      }));
    }

    if (!isValid) {
      setError('Invalid preimage');
      return;
    }

    // Create a new Credential object with trimmed label
    const cred = new credentials.Credential({
      label: trimmedLabel,
      location: url,
      method: method.id,
      macaroon: macaroon,
      invoice: invoice,
      preimage: preimage,
      type: type.id,
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
  };

  return (
    <>
      <Button type='button' onClick={() => setIsOpen(true)}>
        Pay for Credentials
      </Button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>Pay for Credentials</DialogTitle>
        <DialogBody>
          <FieldGroup>
            <Field>
              <Label>URL</Label>
              <Input
                name='url'
                value={url}
                onChange={(e) => setTrimmedUrl(e.target.value)}
                placeholder='Enter URL'
              />
            </Field>
            <Field>
              <Label>Pay with</Label>
              <Combobox
                name='payment'
                value={payment}
                onChange={(option: Option) => setPayment(option)}
                options={PAYMENT_OPTIONS_FILTERED}
                search={false}
              />
            </Field>
            <Field>
              <Label>Invoice</Label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  name='invoice'
                  value={invoice}
                  disabled
                  placeholder='Invoice will be populated automatically'
                  style={{ flexGrow: 1, marginRight: '8px' }}
                />
                <Button
                  onClick={() => copyToClipboard(invoice)}
                  disabled={!invoice}
                  aria-label='Copy invoice'
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <ClipboardIcon className='h-5 w-5' />
                </Button>
              </div>
              {copySuccess && (
                <small style={{ color: 'green' }}>{copySuccess}</small>
              )}
            </Field>
            <Field>
              <Label>Macaroon</Label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  name='macaroon'
                  value={macaroon}
                  onChange={(e) => setMacaroon(e.target.value)}
                  placeholder='Macaroon will be populated automatically'
                  disabled
                />
                <Button
                  onClick={() => copyToClipboard(invoice)}
                  disabled={!invoice}
                  aria-label='Copy macaroon'
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <ClipboardIcon className='h-5 w-5' />
                </Button>
              </div>
            </Field>
            <Field>
              <Label>Preimage</Label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  name='preimage'
                  value={preimage}
                  onChange={(e) => setTrimmedPreimage(e.target.value)}
                  placeholder='Preimage will be populated automatically'
                  disabled
                />
                <Button
                  onClick={() => copyToClipboard(invoice)}
                  disabled={!invoice}
                  aria-label='Copy preimage'
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <ClipboardIcon className='h-5 w-5' />
                </Button>
              </div>
            </Field>

            {preimage && (
              <Fragment>
                <Divider className='my-10' />

                <DialogTitle>
                  Fill in to Save the Credentials (optional)
                </DialogTitle>

                <Field>
                  <Label>Label</Label>
                  <Input
                    name='label'
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder='Enter label'
                    autoFocus
                  />
                </Field>
                <Field>
                  <Label>Method</Label>
                  <Combobox
                    name='method'
                    value={method}
                    onChange={(option: Option) => setMethod(option)}
                    options={METHOD_OPTIONS}
                    search={false}
                  />
                </Field>
                <Field>
                  <Label>Type</Label>
                  <Combobox
                    name='type'
                    value={type}
                    onChange={(option: Option) => setType(option)}
                    options={TYPE_OPTIONS}
                    search={false}
                  />
                </Field>
              </Fragment>
            )}
          </FieldGroup>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePay}
            disabled={isLoading || !url || !!preimage}
          >
            {isLoading ? 'Loading...' : 'Pay'}
          </Button>
          {preimage && (
            <Button
              onClick={handleSaveCredentials}
              disabled={!label || !macaroon || !preimage}
            >
              Save Credentials
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

// Keep validatePreimage as an async function
async function validatePreimage(
  invoice: string,
  preimage: string
): Promise<boolean> {
  try {
    const decoded = decode(invoice);

    // Convert preimage from hex to Uint8Array
    const preimageBuffer = new Uint8Array(
      preimage.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // Hash the preimage using SHA-256
    const calculatedHashBuffer = await crypto.subtle.digest(
      'SHA-256',
      preimageBuffer
    );
    const calculatedHash = Array.from(new Uint8Array(calculatedHashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare the calculated hash with the provided payment hash
    return calculatedHash === decoded.payment_hash;
  } catch (err) {
    console.error('Error validating preimage:', err);
    return false;
  }
}
