import TrainerLayout from '@/components/trainer/trainer-layout';

export default function AthletesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrainerLayout>{children}</TrainerLayout>;
}