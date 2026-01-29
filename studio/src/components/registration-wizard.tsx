'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegistrationSchema, RegistrationFormValues } from '@/lib/schemas';
import { registerTourist } from '@/lib/actions';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  { id: 'Step 1', name: 'Personal Details', fields: ['fullName', 'governmentId'] },
  { id: 'Step 2', name: 'Contact Information', fields: ['email', 'phoneNumber'] },
  { id: 'Step 3', name: 'Travel Itinerary', fields: ['destination', 'travelStartDate', 'travelEndDate'] },
  { id: 'Step 4', name: 'Emergency Contact', fields: ['emergencyContactName', 'emergencyContactPhone'] },
  { id: 'Step 5', name: 'Consent', fields: ['consent'] },
];

export function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      fullName: '',
      governmentId: '',
      email: '',
      phoneNumber: '',
      destination: '',
      travelStartDate: '',
      travelEndDate: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      consent: false,
    },
  });

  type FieldName = keyof RegistrationFormValues;

  const next = async () => {
    const fields = steps[currentStep].fields as FieldName[];
    const output = await form.trigger(fields, { shouldFocus: true });

    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  const onSubmit = (data: RegistrationFormValues) => {
    startTransition(async () => {
      const result = await registerTourist(data);
      if (result.success && result.qrCodeUrl) {
        toast({
          title: 'Registration Successful!',
          description: 'Redirecting you to your digital pass.',
        });
        
        // Store QR code in localStorage to pass to the identity page
        localStorage.setItem('qrCodeUrl', result.qrCodeUrl);

        router.push(`/identity`);

      } else {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: result.message || 'An unknown error occurred.',
        });
      }
    });
  };
  
  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-8">
      <Progress value={progressValue} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <FormField name="fullName" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Enter your full name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="governmentId" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Government ID</FormLabel>
                  <FormControl><Input placeholder="e.g., Passport Number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-4">
               <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input placeholder="name@example.com" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="phoneNumber" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="+1 555-555-5555" type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
          {currentStep === 2 && (
             <div className="space-y-4">
              <FormField name="destination" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination City/Country</FormLabel>
                  <FormControl><Input placeholder="Paris, France" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField name="travelStartDate" control={form.control} render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="travelEndDate" control={form.control} render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>End Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <FormField name="emergencyContactName" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl><Input placeholder="Enter contact's name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="emergencyContactPhone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl><Input placeholder="+1 555-555-5556" type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}
          {currentStep === 4 && (
            <FormField name="consent" control={form.control} render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Agree to Terms and Conditions</FormLabel>
                    <FormDescription>
                      I consent to the use and storage of my data for identification purposes during my travel.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
          )}
          
          <div className="flex justify-between pt-2">
            <Button type="button" onClick={prev} variant="secondary" disabled={currentStep === 0 || isPending}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={next}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Pass
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
