import React, { useState, useEffect, useContext, useMemo } from 'react';
import { UpdateSettings, Version } from '../../wailsjs/go/main/App';

import { Heading, Subheading } from '../components/catalyst/heading';
import { Divider } from '../components/catalyst/divider';
import { Text } from '../components/catalyst/text';
import { Field, FieldGroup, Label } from '../components/catalyst/fieldset';
import { Input } from '../components/catalyst/input';
import { Button } from '../components/catalyst/button';
import { SettingsContext } from '../App';

export function Settings() {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error('SettingsContext must be used within a SettingsProvider');
  const { settings } = context;
  const { refreshSettings } = useContext(SettingsContext)!;
  const [version, setVersion] = useState<string>('');
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [values, setValues] = useState({
    openaiKey: settings?.openai_key || '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    Version().then(setVersion);
  }, []);

  useEffect(() => {
    setValues({
      openaiKey: settings?.openai_key || '',
    });
  }, [settings]);

  const handleSaveSettings = () => {
    // Create a new Settings object with trimmed openai_key
    const data = {
      openai_key: values.openaiKey.trim(),
    };

    // @ts-ignore
    UpdateSettings(data)
      .then(() => {
        // Refresh the settings from the database
        refreshSettings();
        setHasChanged(false);
      })
      .catch((err: any) => {
        console.error('Error saving credentials:', err);
        setError('Failed to save credentials');
      });
  };

  const handleInputChange =
    (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({
        ...values,
        [name]: event.target.value,
      });

      if (!hasChanged) {
        setHasChanged(true);
      }
    };

  return (
    <div className='mx-auto max-w-4xl'>
      <Heading>Settings</Heading>
      <Divider className='my-10 mt-6' />

      <section className='grid gap-x-8 gap-y-6 sm:grid-cols-2'>
        <div className='space-y-1'>
          <Subheading>Version</Subheading>
          <Text>The version of the application.</Text>
        </div>
        <div>
          <Text>{version}</Text>
        </div>
      </section>

      <Divider className='my-10' soft />

      <div className={'space-y-4'}>
        <FieldGroup>
          <Field>
            <Label>OpenAI API Key</Label>
            <Input
              name='openaiKey'
              value={values.openaiKey}
              onChange={handleInputChange('openaiKey')}
              placeholder='Enter OpenAI API Key'
            />
          </Field>
        </FieldGroup>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <Button onClick={handleSaveSettings} disabled={!hasChanged}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
