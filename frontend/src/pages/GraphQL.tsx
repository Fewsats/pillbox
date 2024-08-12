import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  FormEventHandler,
} from 'react';
import { Heading } from '../components/catalyst/heading';

import { GraphiQL } from 'graphiql';
import type { Fetcher } from '@graphiql/toolkit';
import 'graphiql/graphiql.min.css';
import { Field, Label } from '../components/catalyst/fieldset';
import { Combobox } from '../components/catalyst/combobox';
import { CredentialsContext } from '../App';
import { Input } from '../components/catalyst/input';
import { toast, ToastContainer } from 'react-toastify';
import { getIntrospectionQuery } from 'graphql';
// @ts-ignore
import { request, gql } from 'graphql-request';
import { OpenAI } from 'openai';
import { Textarea } from '../components/catalyst/textarea';
import { Button } from '../components/catalyst/button';

const introspectionQuery = gql`
  ${getIntrospectionQuery()}
`;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

type Option = {
  id: string;
  name: string;
  details?: {
    url: string;
    l402Credentials: string;
  };
};

export const GraphQL: React.FC = () => {
  const context = useContext(CredentialsContext);
  if (!context)
    throw new Error(
      'CredentialsContext must be used within a CredentialsProvider'
    );
  const { credentials } = context;

  const options = useMemo(() => {
    const filtered = credentials
      ?.filter((item) => item.type === 'graphql')
      .map((item) => ({
        id: item.id,
        name: item.label,
        details: {
          url: item.location,
          l402Credentials: `${item.macaroon}:${item.preimage}`,
        },
      }));
    const notSelectedOption = {
      id: 'na',
      name: 'Not Selected',
    };

    return [notSelectedOption, ...(filtered || [])];
  }, [credentials]);

  const [active, setActive] = useState<Option>(
    options.length ? options[0] : { id: '', name: '' }
  );
  const [url, setUrl] = useState('');
  const [l402Credentials, setL402Credentials] = useState('');

  useEffect(() => {
    setUrl(active?.details?.url || '');
    setL402Credentials(active?.details?.l402Credentials || '');
  }, [active]);

  const [isValidCredentials, setIsValidCredentials] = useState(false);
  const [status, setStatus] = useState<{ message: string; ok: boolean } | null>(
    null
  );
  const [schema, setSchema] = useState<any | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [query, setQuery] = useState('');
  const [toExecute, setToExecute] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'assistant' | 'user'; message: string }[]
  >([]);

  useEffect(() => {
    const isValid = /^[^:]+:[^:]+$/.test(l402Credentials.trim());
    setIsValidCredentials(isValid);
  }, [l402Credentials]);

  useEffect(() => {
    setSchema(null);
    setGeneratedQuery('');
    setMessages([]);
  }, [url]);

  const fetcher: Fetcher = useCallback(
    async (graphQLParams) => {
      if (!l402Credentials) {
        console.log('No L402 credentials provided');
        return Promise.resolve('');
      }

      if (!url) {
        console.log('No queryUrl provided');
        return Promise.resolve('');
      }

      try {
        console.log('Fetching from queryUrl:', url);
        let response;

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (isValidCredentials) {
          const [macaroon, preimage] = l402Credentials.split(':');
          headers['Authorization'] = `L402 ${macaroon}:${preimage}`;
        } else {
          console.log('Invalid credentials');
          return Promise.resolve('');
        }

        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(graphQLParams),
        });

        console.log('Fetch response status:', response.status);
        if (response.ok) {
          setStatus({ message: `${response.status} OK`, ok: true });

          if (!schema) {
            const data = await request(
              url,
              introspectionQuery,
              {},
              headers
            ).catch((err: any) => {
              console.error(err);
            });

            toast.success('Fetched schema successfully');
            setSchema(data);
          }
        } else if (response.status === 402) {
          setStatus({ message: '402 Payment Required', ok: false });
          toast.error('Failed to fetch URL. 402 Payment Required');
          throw new Error('Payment required');
        } else {
          setStatus({
            message: `${response.status} ${response.statusText}`,
            ok: false,
          });
          toast.error('Failed to fetch URL');
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
    },
    [url, l402Credentials, isValidCredentials, schema]
  );

  const submitMessage = async (e: any) => {
    // @ts-ignore
    e.preventDefault();

    setMessages((prevState) => [
      ...prevState,
      {
        role: 'user',
        message: `<p>${prompt}</p>`,
      },
    ]);

    setPrompt('');

    generateQuery();
  };

  const generateQuery = async () => {
    if (!schema) {
      // toast.error('GraphQL schema not available');
      // return;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Choose the appropriate model
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that generates GraphQL queries based on the provided schema and user prompt.',
          },
          {
            role: 'user',
            content: `Given the following GraphQL schema: ${JSON.stringify(schema)}, generate a GraphQL query based on this prompt: ${prompt}`,
          },
        ],
        // max_tokens: 150,  // Adjust as necessary
      });

      const { formattedResponse, graphqlQuery } = formatOpenAIResponse(
        response?.choices[0]?.message?.content?.trim() || ''
      );
      setGeneratedQuery(graphqlQuery);
      setMessages((prevState) => [
        ...prevState,
        {
          role: 'assistant',
          message: formattedResponse,
        },
      ]);
    } catch (error) {
      console.error('Error generating query:', error);
      toast.error('Failed to generate query');
    }
  };

  const formatOpenAIResponse = (response: string) => {
    // Extract the GraphQL query if it exists
    const graphqlQueryMatch = response.match(/```graphql\n([\s\S]*?)\n```/);
    const graphqlQuery = graphqlQueryMatch ? graphqlQueryMatch[1].trim() : '';

    // Split the response into parts before and after the GraphQL query
    const [beforeQuery, afterQuery] = response.split(
      /```graphql\n[\s\S]*?\n```/
    );

    // Format the response with styled HTML
    const formattedResponse = `
    <p>${beforeQuery.replace(/\n/g, '<br>')}</p>
    ${graphqlQuery ? `<pre><code class="graphql">${graphqlQuery}</code></pre>` : ''}
    <p>${afterQuery ? afterQuery.replace(/\n/g, '<br>') : ''}</p>
  `;

    return {
      formattedResponse: formattedResponse.trim(),
      graphqlQuery,
    };
  };

  const handleExecute = async () => {
    setQuery(generatedQuery);
    setToExecute(true);
  };

  useEffect(() => {
    if (query && toExecute) {
      const button = document.querySelector('button.graphiql-execute-button');

      if (button) {
        // @ts-ignore
        button.click();
      }

      setToExecute(false);
    }
  }, [toExecute, query]);

  const handleEditQuery = (newQuery: string) => {
    setQuery(newQuery);
  };

  return (
    <div className='mx-auto max-w-[1920px] p-4'>
      <Heading level={1} className='mb-4 px-4'>
        GraphQL Explorer
      </Heading>

      <div className='flex-1 overflow-hidden'>
        <div className='graphiql-session-header flex w-full space-x-4 border-b border-gray-200 px-4 py-2'>
          <Field className={'flex-1'}>
            <Label>Query URL:</Label>
            <Combobox
              value={active}
              onChange={(option) => {
                setActive(option);
                setStatus(null);
              }}
              options={options}
              search={true}
              name={'fileUrl'}
            />
          </Field>
          <Field className={'flex-1'}>
            <Label htmlFor='url'>File URL:</Label>
            <Input
              id='url'
              type='url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </Field>
          <Field className={'flex-1'}>
            <Label htmlFor='l402'>L402 Credentials:</Label>
            <Input
              id='l402'
              type='text'
              value={l402Credentials}
              onChange={(e) => setL402Credentials(e.target.value)}
              required
            />
          </Field>
        </div>
        {/*
        status && (
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: status.ok ? 'green' : 'red',
              marginRight: '16px',
            }}
          >
            {status.message}
          </span>
        )
        */}
        <div className={'flex space-x-4'}>
          <div className='graphiql-query-input w-full max-w-xs space-x-4 px-4 py-2'>
            <form className={'space-y-4 py-2'} onSubmit={submitMessage}>
              <Field className={'flex-1'}>
                <Label htmlFor='prompt'>Query Prompt:</Label>
                <Textarea
                  id='prompt'
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </Field>
              <div className={'flex space-x-4'}>
                <Button type='submit'>Generate Query</Button>
                <Button
                  type='button'
                  onClick={handleExecute}
                  disabled={!generatedQuery}
                >
                  Apply Query
                </Button>
              </div>
            </form>

            {!!messages.length && (
              <div className='space-y-4 py-2'>
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`text-base text-zinc-950 dark:text-white ${message.role === 'user' ? 'ml-auto w-fit rounded-lg bg-gray-100 px-4 py-2' : ''}`}
                    dangerouslySetInnerHTML={{ __html: message.message }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            <GraphiQL
              fetcher={fetcher}
              query={query}
              onEditQuery={handleEditQuery}
            />
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};
