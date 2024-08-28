'use client';

import { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Loader({
  position,
  background,
  height,
  width,
}: {
  position?: string;
  background?: string;
  height?: string;
  width?: string;
}) {
  return (
    <div
      aria-live='assertive'
      className={`pointer-events-none ${
        position ? position : 'relative'
      } z-60 inset-0 flex items-end px-4 py-8 sm:items-start sm:p-5`}
    >
      <div className='flex w-full flex-col items-center space-y-4 sm:items-end'>
        <Transition
          show={true}
          as={Fragment}
          enter='transform ease-out duration-300 transition'
          enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
          enterTo='translate-y-0 opacity-100 sm:translate-x-0'
          leave='transition ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div
            className={`pointer-events-auto ${
              position ? position : 'fixed'
            } bottom-0 left-0 right-0 top-0 flex h-full w-full items-center justify-center overflow-hidden ${
              background ? background : ''
            }`}
          >
            <ArrowPathIcon
              className={`${height ? height : 'h-10'} ${
                width ? width : 'w-10'
              } animate-spin text-gray-500`}
            />
          </div>
        </Transition>
      </div>
    </div>
  );
}
