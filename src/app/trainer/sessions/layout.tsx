import TrainerLayout from '@/components/trainer/trainer-layout';

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrainerLayout>{children}</TrainerLayout>;
}