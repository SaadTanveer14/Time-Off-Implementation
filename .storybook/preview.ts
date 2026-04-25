import type { Preview } from '@storybook/react'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { handlers } from '../src/mocks/hcm/handlers'
import '../src/app/globals.css'

// Start MSW with unhandled request warning (not error, so missing handlers don't break stories)
initialize({ onUnhandledRequest: 'warn' })

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: [...handlers],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
