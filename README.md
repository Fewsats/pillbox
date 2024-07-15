# Pillbox

*L402 access, simplified"*

Pillbox is a tool designed to help you manage your L402 credentials and access L402 paywalled endpoints with ease. Whether you need to download files, watch videos, or query APIs protected by L402, Pillbox has got you covered.

## How It Works

Pillbox simplifies the process of managing L402 credentials:

1. Add credentials by pasting the L402 paywalled URL
2. Fetch the macaroon and invoice
3. Pay the invoice using any Lightning wallet
4. Paste the preimage
5. Save the credentials for future use

**Important:** Lightning payments are made separately from this app. You'll need to use your own Lightning wallet to pay invoices. After payment, make sure your wallet shows you the "preimage" - a special code that proves you paid. You'll need to copy this preimage into Pillbox to complete the process.

## Features

- Easy management of L402 credentials
- Support for various L402 paywalled content types
- Secure storage of credentials
- User-friendly interface

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use
 
```
make release
```