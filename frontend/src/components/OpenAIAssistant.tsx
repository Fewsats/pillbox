import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useErrorContext } from '../App';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

const AssistantTab = () => {
  const { fetcherError } = useErrorContext();

  console.log('fetcherError', fetcherError);
  const context = useSchemaContext();
  const schema = useMemo(() => {
    if (context?.schema) {
      const typeMap = context.schema.getTypeMap();
      return Object.keys(typeMap).map((key) => typeMap[key].name);
    }
    return null;
  }, [context]);

  const executionContext = useExecutionContext();
  const editorContext = useEditorContext();

  const [prompt, setPrompt] = useState('');
  const [promptPrev, setPromptPrev] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [messages, setMessages] = useState<
    { role: 'assistant' | 'user'; message: string }[]
  >([]);

  const promptRef: React.RefObject<HTMLTextAreaElement> = useRef(null);

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

    setPromptPrev(prompt);
    setPrompt('');

    generateQuery();
  };

  const generateQuery = async () => {
    if (!context?.schema) {
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
            content: `Given the following GraphQL schema: ${JSON.stringify(context?.schema)}, generate a GraphQL query based on this prompt: ${prompt}`,
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

  const handleError = async (error: string) => {
    if (!error || !context?.schema) {
      // toast.error('GraphQL schema not available');
      return;
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
            content: `Given the following GraphQL schema: ${JSON.stringify(context.schema)}, generate a GraphQL query based on this prompt: ${promptPrev}, considering that your previous suggested query ${generatedQuery} failed with error ${error}`,
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

  return (
    <div
      className={`graphiql-query-input flex h-full max-w-96 flex-1 shrink-0 flex-col space-y-4`}
    >
      <div className='graphiql-openai-messages-container my-2 flex-1 space-y-4 overflow-y-auto'>
        {!schema && (
          <div className={'p-2 text-sm font-medium text-red-600'}>
            Choose Query URL (or add url and credentials manually) to receive
            GraphQL schema for Assistant to use
          </div>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={`text-base text-zinc-950 dark:text-white ${message.role === 'user' ? 'ml-auto w-fit rounded-lg bg-gray-100 px-4 py-2' : ''}`}
            dangerouslySetInnerHTML={{ __html: message.message }}
          />
        ))}
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
