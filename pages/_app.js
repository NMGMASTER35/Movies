import '../styles/globals.css';
import { AnnouncementsProvider } from '../components/AnnouncementsProvider';

export default function App({ Component, pageProps }) {
  return (
    <AnnouncementsProvider>
      <Component {...pageProps} />
    </AnnouncementsProvider>
  );
}
