import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import {
  useSchemaContext,
  useExecutionContext,
  useEditorContext,
} from '@graphiql/react';
import { Field, Label } from './catalyst/fieldset';
import { Textarea } from './catalyst/textarea';
import { Button } from './catalyst/button';
import { toast } from 'react-toastify';
import { OpenAI } from 'openai';
import { SettingsContext, useErrorContext } from '../App';
import Loader from './Loader';

const AssistantTab = () => {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext)
    throw new Error('SettingsContext must be used within a SettingsProvider');
  const { settings } = settingsContext;

  const openai = new OpenAI({
    apiKey: settings.openai_key,
    dangerouslyAllowBrowser: true,
  });

  const { fetcherError } = useErrorContext();

  const context = useSchemaContext();
  const schema = useMemo(() => {
    if (context?.schema) {
      return context?.schema?.getQueryType()?.getFields();
    }
    return null;
  }, [context]);

  const executionContext = useExecutionContext();
  const editorContext = useEditorContext();

  const [prompt, setPrompt] = useState('');
  const [promptPrev, setPromptPrev] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [messages, setMessages] = useState<
    { role: 'assistant' | 'user'; message: string; id: number }[]
  >([]);

  const [isFetching, setIsFetching] = useState(false);

  const promptRef: React.RefObject<HTMLTextAreaElement> = useRef(null);
  const messagesRef: React.RefObject<HTMLDivElement> = useRef(null);

  const submitMessage = async (e: any) => {
    // @ts-ignore
    e.preventDefault();

    setMessages((prevState) => [
      ...prevState,
      {
        role: 'user',
        message: `<p>${prompt}</p>`,
        id: Date.now(),
      },
    ]);

    setPromptPrev(prompt);
    setPrompt('');
    generateQuery();
  };

  const generateQuery = async () => {
    if (!schema) {
      // toast.error('GraphQL schema not available');
      // return;
    }

    setIsFetching(true);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Choose the appropriate model
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant. Use the GraphQL schema to answer the question appropriately. Whenever you generate example queries, provide sensible default values so they are ready to use. Format the queries with indentation and line breaks. The generated queries should be named, like `query GetUserByID { ... }`',
          },
          {
            role: 'user',
            content: `Question: ${prompt}\n\nGraphQL Schema: ${JSON.stringify(schema)}. Please do not include comments inside the queries code you generate.`,
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
          id: Date.now(),
        },
      ]);
      setIsFetching(false);
    } catch (error) {
      console.error('Error generating query:', error);
      toast.error('Failed to generate query');
      setIsFetching(false);
    }
  };

  const handleError = async (error: string) => {
    if (!error || !schema) {
      // toast.error('GraphQL schema not available');
      return;
    }

    setIsFetching(true);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Choose the appropriate model
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant. Use the GraphQL schema to answer the question appropriately. Whenever you generate example queries, provide sensible default values so they are ready to use. Format the queries with indentation and line breaks. The generated queries should be named, like `query GetUserByID { ... }`',
          },
          {
            role: 'user',
            content: `Question: ${promptPrev}\n\nGraphQL Schema: ${JSON.stringify(schema)}, considering that your previous suggested query ${generatedQuery} failed with error ${error}. Please do not include comments inside the queries code you generate.`,
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
          id: Date.now(),
        },
      ]);
      setIsFetching(false);
    } catch (error) {
      console.error('Error generating query:', error);
      toast.error('Failed to generate query');
      setIsFetching(false);
    }
  };

  const formatOpenAIResponse = (response: string) => {
    // Match all code blocks (generic) in the response
    const codeBlockMatches = [
      ...response.matchAll(/```([a-zA-Z0-9]*)\n([\s\S]*?)\n```/g),
    ];
    const graphqlQueries = codeBlockMatches.map((match) => ({
      language: match[1],
      code: match[2].trim(),
    }));

    // Split the response by code block delimiters
    const parts = response.split(/```[a-zA-Z0-9]*\n[\s\S]*?\n```/);

    // Build the formatted response with styled HTML
    let formattedResponse = '';

    parts.forEach((part: string, index: number) => {
      // Handle text marked with ### (heading)
      let formattedPart = part.replace(
        /###\s+(.*?)(?=\n|$)/g,
        (match, heading) => {
          return `<h3 class="text-lg font-semibold text-zinc-950 dark:text-white">${heading.trim()}</h3>`;
        }
      );

      // Handle text marked with ** (bold)
      formattedPart = formattedPart.replace(
        /\*\*(.*?)\*\*/g,
        (match, boldText) => {
          return `<span class="font-semibold">${boldText.trim()}</span>`;
        }
      );

      // Handle list items for both unordered and ordered lists
      formattedPart = formattedPart.replace(
        /(^|\n)([\*\-\d\.]+)\s+(.*?)(?=\n|$)/g,
        (match, p1, marker, item) => {
          return `${p1}<li>${item.trim()}</li>`;
        }
      );

      // Wrap list items in <ul> or <ol>
      formattedPart = formattedPart.replace(
        /(<li>.*?<\/li>)(?:(?=\n)|$)/gs,
        (list) => {
          // Determine if it’s an ordered or unordered list
          return list.startsWith('<li>1.')
            ? `<ol class="list-decimal pl-5">${list}</ol>`
            : `<ul class="list-disc pl-5">${list}</ul>`;
        }
      );

      // Add the text before the GraphQL query
      formattedResponse += `<p class="text-base text-zinc-950 dark:text-white">${formattedPart.replace(/\n/g, '<br>')}</p>`;

      // If there is a corresponding GraphQL query, add it as well
      if (index < graphqlQueries.length) {
        formattedResponse += `<pre><code class="graphql">${graphqlQueries[index].code}</code></pre>`;
      }
    });

    return {
      formattedResponse: formattedResponse.trim(),
      graphqlQuery:
        graphqlQueries
          .filter((block) => block.language === 'graphql')
          .map((block) => block.code)
          .pop() || '',
    };
  };

  const handleExecute = async () => {
    if (editorContext?.queryEditor && executionContext) {
      await editorContext.queryEditor.setValue(generatedQuery);
      executionContext.run();
    }
  };

  useEffect(() => {
    if (fetcherError?.errors?.length) {
      handleError(JSON.stringify(fetcherError?.errors));
    }
  }, [fetcherError]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage) {
      const node = document.getElementById(lastMessage.id.toString());
      if (node) {
        node.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isFetching && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [isFetching]);

  return (
    <div
      className={`graphiql-query-input flex h-full max-w-96 flex-1 shrink-0 flex-col space-y-4`}
    >
      <div
        className='graphiql-openai-messages-container my-2 flex flex-1 flex-col space-y-4 overflow-y-auto'
        ref={messagesRef}
      >
        {!schema && (
          <div className={'p-2 text-sm font-medium text-red-600'}>
            Choose Query URL (or add url and credentials manually) to receive
            GraphQL schema for Assistant to use
          </div>
        )}
        {messages.map((message, i) => (
          <div
            key={message.id}
            className={`text-base text-zinc-950 dark:text-white ${message.role === 'user' ? 'user ml-auto w-fit rounded-lg bg-gray-100 px-4 py-2 dark:bg-zinc-800' : 'assistant'}`}
            dangerouslySetInnerHTML={{ __html: message.message }}
            id={message.id.toString()}
          />
        ))}
        {isFetching && (
          <div className={'flex flex-1 items-center justify-center'}>
            <Loader position={'static'} height={'h-6'} width={'w-6'} />
          </div>
        )}
      </div>
      <form className={'space-y-4'} onSubmit={submitMessage}>
        <Field className={'flex-1'}>
          <Label htmlFor='prompt'>Query Prompt:</Label>
          <Textarea
            id='prompt'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            resizable={false}
            ref={promptRef}
          />
        </Field>
        <div className={'flex space-x-4'}>
          <Button type='submit' disabled={!schema}>
            Generate Query
          </Button>
          <Button
            type='button'
            onClick={handleExecute}
            disabled={!generatedQuery}
          >
            Apply Query
          </Button>
        </div>
      </form>
    </div>
  );
};

const AssistantIcon = () => {
  return <ChatBubbleLeftRightIcon className={'h-6 w-6 text-gray-500'} />;
};

const OpenAIAssistant = {
  title: 'Assistant',
  icon: AssistantIcon,
  content: AssistantTab,
};

export default OpenAIAssistant;
