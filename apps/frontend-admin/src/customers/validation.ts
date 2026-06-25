import {
  banglaToLatinDigitsOnly,
  banglaToLatinPhone,
  isDigitsOnly,
  isValidMemoBnInput,
} from '@razzak-machinaries/shared/i18n';
import type { Customer } from '@razzak-machinaries/shared/api';

export type CustomerFormValues = {
  fullNameBn: string;
  fullNameEn: string;
  addressBn: string;
  addressEn: string;
  phoneBn: string;
  phoneEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  memoPageNumberBn: string;
  memoPageNumberEn: string;
  mediatorNameBn: string;
  mediatorNameEn: string;
};

export type CustomerFormErrors = Partial<Record<keyof CustomerFormValues, string>>;

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  fullNameBn: '',
  fullNameEn: '',
  addressBn: '',
  addressEn: '',
  phoneBn: '',
  phoneEn: '',
  fatherNameBn: '',
  fatherNameEn: '',
  memoPageNumberBn: '',
  memoPageNumberEn: '',
  mediatorNameBn: '',
  mediatorNameEn: '',
};

const BD_PHONE_PATTERN = /^(\+880|880|0)?1[3-9]\d{8}$/;

export function resolvePhoneLatin(values: CustomerFormValues): string {
  const manual = values.phoneEn.trim();
  if (manual) {
    return manual.replace(/\s+/g, '');
  }
  return banglaToLatinPhone(values.phoneBn);
}

export function resolveMemoLatin(values: CustomerFormValues): string {
  const manual = values.memoPageNumberEn.trim();
  if (manual) {
    return manual;
  }
  return banglaToLatinDigitsOnly(values.memoPageNumberBn);
}

export function trimCustomerFormValues(values: CustomerFormValues): CustomerFormValues {
  return {
    fullNameBn: values.fullNameBn.trim(),
    fullNameEn: values.fullNameEn.trim(),
    addressBn: values.addressBn.trim(),
    addressEn: values.addressEn.trim(),
    phoneBn: values.phoneBn.trim(),
    phoneEn: values.phoneEn.trim(),
    fatherNameBn: values.fatherNameBn.trim(),
    fatherNameEn: values.fatherNameEn.trim(),
    memoPageNumberBn: values.memoPageNumberBn.trim(),
    memoPageNumberEn: values.memoPageNumberEn.trim(),
    mediatorNameBn: values.mediatorNameBn.trim(),
    mediatorNameEn: values.mediatorNameEn.trim(),
  };
}

export function validateCustomerForm(values: CustomerFormValues): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  if (!values.fullNameBn) errors.fullNameBn = 'customer.validation.required';
  if (!values.fullNameEn) errors.fullNameEn = 'customer.validation.required';
  if (!values.addressBn) errors.addressBn = 'customer.validation.required';
  if (!values.addressEn) errors.addressEn = 'customer.validation.required';
  if (!values.fatherNameBn) errors.fatherNameBn = 'customer.validation.required';
  if (!values.fatherNameEn) errors.fatherNameEn = 'customer.validation.required';

  if (!values.phoneBn) {
    errors.phoneBn = 'customer.validation.required';
  }

  const phone = resolvePhoneLatin(values);
  if (values.phoneBn && !phone) {
    errors.phoneBn = 'customer.validation.invalidPhone';
  } else if (phone && !BD_PHONE_PATTERN.test(phone)) {
    errors.phoneBn = 'customer.validation.invalidPhone';
  }

  if (!values.memoPageNumberBn) {
    errors.memoPageNumberBn = 'customer.validation.required';
  } else if (!isValidMemoBnInput(values.memoPageNumberBn)) {
    errors.memoPageNumberBn = 'customer.validation.invalidMemoPageNumber';
  }

  const memo = resolveMemoLatin(values);
  if (values.memoPageNumberBn && !memo) {
    errors.memoPageNumberBn = 'customer.validation.invalidMemoPageNumber';
  } else if (memo && !isDigitsOnly(memo)) {
    errors.memoPageNumberBn = 'customer.validation.invalidMemoPageNumber';
  }

  return errors;
}

export function buildCustomerFormData(
  values: CustomerFormValues,
  profilePicture: File | null,
): FormData {
  const formData = new FormData();
  formData.append('fullNameBn', values.fullNameBn);
  formData.append('fullNameEn', values.fullNameEn);
  formData.append('addressBn', values.addressBn);
  formData.append('addressEn', values.addressEn);
  formData.append('phoneBn', values.phoneBn);
  formData.append('phoneEn', resolvePhoneLatin(values));
  formData.append('fatherNameBn', values.fatherNameBn);
  formData.append('fatherNameEn', values.fatherNameEn);
  formData.append('memoPageNumberBn', values.memoPageNumberBn);
  formData.append('memoPageNumberEn', resolveMemoLatin(values));
  formData.append('mediatorNameBn', values.mediatorNameBn);
  formData.append('mediatorNameEn', values.mediatorNameEn);
  if (profilePicture) {
    formData.append('profilePicture', profilePicture);
  }
  return formData;
}

export function customerToFormValues(customer: Customer): CustomerFormValues {
  return {
    fullNameBn: customer.fullNameBn,
    fullNameEn: customer.fullNameEn,
    addressBn: customer.addressBn,
    addressEn: customer.addressEn,
    phoneBn: customer.phoneBn,
    phoneEn: customer.phoneEn,
    fatherNameBn: customer.fatherNameBn,
    fatherNameEn: customer.fatherNameEn,
    memoPageNumberBn: customer.memoPageNumberBn,
    memoPageNumberEn: customer.memoPageNumberEn,
    mediatorNameBn: customer.mediatorNameBn,
    mediatorNameEn: customer.mediatorNameEn,
  };
}
