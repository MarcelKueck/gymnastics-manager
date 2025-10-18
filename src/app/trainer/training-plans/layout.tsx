import TrainerLayout from '@/components/trainer/trainer-layout';

export default function TrainingPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrainerLayout>{children}</TrainerLayout>;
}