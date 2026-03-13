import { Metadata } from 'next';
import NewThreadClient from './NewThreadClient';

export const metadata: Metadata = {
  title: 'Start a Discussion | AlbionKit Forum',
  description: 'Create a new thread, share builds, recruit for your guild, or find a group on AlbionKit.',
};

export default function NewThreadPage() {
  return <NewThreadClient />;
}
