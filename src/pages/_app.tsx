import { AppProps } from 'next/app';
import { Provider as NextAuthProvider } from "next-auth/client"
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

import { Header } from '../components/Header';
import '../styles/global.scss';

const paypalOptions = {
  "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_PROD || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_DEV,
  currency: "BRL",
  intent: "capture"
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NextAuthProvider session={pageProps.session}>
      <PayPalScriptProvider options={paypalOptions}>
        <Header/>
        <Component {...pageProps} />
      </PayPalScriptProvider>
    </NextAuthProvider>
  )
}

export default MyApp
