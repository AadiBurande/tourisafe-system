import { RegistrationWizard } from '@/components/registration-wizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex justify-center items-center gap-2 mb-2">
            <QrCode className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl font-bold">VisitPass Registration</CardTitle>
          </div>
          <CardDescription>Complete the steps below to create your digital travel pass.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <RegistrationWizard />
        </CardContent>
      </Card>
    </div>
  );
}
