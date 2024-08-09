import * as Headless from '@headlessui/react';
import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

type Option = {
  name: string;
  id: string;
};

export const Combobox = forwardRef(function Input(
  {
    className,
    options,
    value,
    onChange,
    name,
    search = false,
    ...props
  }: {
    className?: string;
    options: Option[];
    value: Option;
    onChange: (option: Option) => void;
    name: string;
    search: boolean;
  } & Omit<Headless.ComboboxProps<any, any>, 'className'>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.name.toLowerCase().includes(query.toLowerCase());
        });

  const handleChange = (newValue: Option) => {
    onChange(newValue);
  };

  return (
    <span
      data-slot='control'
      className={clsx([
        className,
        // Basic layout
        'relative block w-full',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:after:focus-within:ring-2 sm:after:focus-within:ring-blue-500',
        // Disabled state
        search
          ? 'before:has-[[data-disabled]]:bg-zinc-950/5 before:has-[[data-disabled]]:shadow-none'
          : '',
        // Invalid state
        search ? 'before:has-[[data-invalid]]:shadow-red-500/10' : '',
      ])}
    >
      <Headless.Combobox
        value={value?.id}
        onChange={handleChange}
        onClose={() => setQuery('')}
      >
        {({ open }) => (
          <React.Fragment>
            <div className='relative'>
              <Headless.ComboboxInput
                aria-label={name}
                displayValue={(option: Option) => value?.name}
                onChange={(event) => setQuery(event.target.value)}
                className={clsx(
                  // Basic layout
                  'relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] has-[[data-disabled]]:opacity-50 sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
                  // Typography
                  'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
                  // Border
                  'border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20',
                  // Background color
                  'bg-transparent dark:bg-white/5',
                  // Hide default focus styles
                  'focus:outline-none',
                  // Invalid state
                  search
                    ? 'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500'
                    : '',
                  // Disabled state
                  search
                    ? 'data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%]'
                    : '',
                  // System icons
                  'dark:[color-scheme:dark]',
                  !search ? '!text-transparent' : ''
                )}
                disabled={!search}
              />
              {!search && (
                <div
                  style={{
                    width: 'calc(100% + 2px)',
                    height: 'calc(100% + 2px)',
                  }}
                  className={clsx(
                    // Basic layout
                    'absolute -left-[1px] -top-[1px] block h-full w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] text-left sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
                    // Typography
                    'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
                    // Border
                    // 'border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20',
                    // Background color
                    'bg-transparent dark:bg-white/5',
                    // Hide default focus styles
                    'focus:outline-none',
                    // Hide default active styles
                    'active:outline-none',
                    // Invalid state
                    'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500',
                    // Disabled state
                    'data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%]',
                    // System icons
                    'dark:[color-scheme:dark]',
                    open // Focus ring
                      ? 'rounded-lg ring-2 ring-inset sm:ring-blue-500'
                      : ''
                  )}
                >
                  <span className={'leading-7'}>{value?.name}</span>
                  <Headless.ComboboxButton className='group absolute inset-y-0 right-0 flex w-full items-center justify-end px-2.5'>
                    <ChevronDownIcon
                      className={clsx(
                        'size-4 transform fill-zinc-950/60 transition-all group-data-[hover]:fill-zinc-950',
                        open ? 'rotate-180' : 'rotate-0'
                      )}
                    />
                  </Headless.ComboboxButton>
                </div>
              )}
              {search && (
                <Headless.ComboboxButton className='group absolute inset-y-0 right-0 px-2.5'>
                  <ChevronDownIcon
                    className={clsx(
                      'size-4 transform fill-zinc-950/60 transition-all group-data-[hover]:fill-zinc-950',
                      open ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                </Headless.ComboboxButton>
              )}
            </div>
            <Headless.ComboboxOptions
              anchor='bottom'
              className={clsx(
                'w-[var(--input-width)] rounded-xl border border-white/5 bg-white/5 [--anchor-gap:var(--spacing-1)] empty:invisible',
                'translate-y-2 transform transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0',
                // Background color
                'bg-white dark:bg-zinc-950',
                // Border
                'border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20'
              )}
            >
              <div
                className={clsx(
                  'p-1',
                  // Background color
                  'bg-white dark:bg-zinc-950'
                )}
              >
                {filteredOptions.map((option: Option) => (
                  <Headless.ComboboxOption
                    key={option.id}
                    value={option}
                    className={clsx(
                      'data-[focus]:bg-white/10, group flex cursor-default cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-zinc-950/5 dark:hover:bg-white/5',
                      // Typography
                      'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
                      // System icons
                      'dark:[color-scheme:dark]',
                      value?.id === option.id ? 'font-medium' : ''
                    )}
                  >
                    {option.name}
                  </Headless.ComboboxOption>
                ))}
              </div>
            </Headless.ComboboxOptions>
          </React.Fragment>
        )}
      </Headless.Combobox>
    </span>
  );
});
