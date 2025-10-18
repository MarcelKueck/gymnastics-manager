import TrainerLayout from '@/components/trainer/trainer-layout';

export default function TrainerMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrainerLayout>{children}</TrainerLayout>;
}