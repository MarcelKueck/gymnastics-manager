import { ReactNode } from 'react';
import AthleteLayout from '@/components/athlete/athlete-layout';

export default function Layout({ children }: { children: ReactNode }) {
  return <AthleteLayout>{children}</AthleteLayout>;
}