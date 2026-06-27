export type StaffFormValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  isActive: boolean;
  temporaryPassword: string;
};

export type StaffFormErrors = Partial<Record<keyof StaffFormValues, string>>;

export function validateStaffForm(values: StaffFormValues, language: 'en' | 'bn'): StaffFormErrors {
  const errors: StaffFormErrors = {};
  const required = language === 'bn' ? 'এই ক্ষেত্রটি প্রয়োজনীয়।' : 'This field is required.';

  if (!values.firstName.trim()) errors.firstName = required;
  if (!values.lastName.trim()) errors.lastName = required;
  if (!values.username.trim()) errors.username = required;

  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = language === 'bn' ? 'সঠিক ইমেইল লিখুন।' : 'Enter a valid email address.';
  }

  return errors;
}

export function hasStaffFormErrors(errors: StaffFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
