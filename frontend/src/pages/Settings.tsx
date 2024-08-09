import { useState, useEffect } from 'react';
import { Version } from '../../wailsjs/go/main/App';

import { Heading, Subheading } from '../components/catalyst/heading';
import { Divider } from '../components/catalyst/divider';
import { Text } from '../components/catalyst/text';

export function Settings() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    Version().then(setVersion);
  }, []);

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
    </div>
  );
}
