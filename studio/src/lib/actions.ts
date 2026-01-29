'use server';

import { RegistrationFormValues } from './schemas';
import { registerTourist as registerTouristApi } from '@/services/api';

export async function registerTourist(data: RegistrationFormValues): Promise<{ success: boolean; qrCodeUrl?: string; message?: string }> {
  try {
    // The API service expects a different structure, so we map the form data.
    const apiData = {
      personal_info: {
        full_name: data.fullName,
        // These fields are not in the form, so we're using placeholders.
        date_of_birth: '1990-01-01',
        gender: 'Not specified',
        nationality: 'Not specified',
      },
      government_id: {
        id_type: 'Passport',
        id_number: data.governmentId,
        id_document_url: '',
      },
      contact_details: {
        mobile_number: data.phoneNumber,
        email: data.email,
      },
      travel_details: {
        trip_itinerary: [{ city: data.destination, check_in: data.travelStartDate, check_out: data.travelEndDate, accommodation: '' }],
        arrival_date: data.travelStartDate,
        departure_date: data.travelEndDate,
        booking_reference: '',
      },
      emergency_info: {
        contacts: [{ name: data.emergencyContactName, relationship: 'Not specified', mobile_number: data.emergencyContactPhone }],
        blood_group: '',
        medical_conditions: '',
      },
      consent: {
        live_tracking: data.consent,
        health_data_sharing: data.consent,
        data_usage_acknowledgement: data.consent,
      },
    };

    const result = await registerTouristApi(apiData);
    
    return result;

  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during registration.';
    return { success: false, message };
  }
}
