import { http, HttpResponse } from 'msw';

export const sampleSaleConfirmation = {
  id: 25,
  displayId: 'COM-25',
  transactionType: 'SALE' as const,
  date: '2026-06-25',
  totalAmount: '12300.00',
  note: 'Machinery parts',
  paymentMethod: '',
  customerId: 1,
  customerNameBn: 'রহিম',
  customerNameEn: 'Rahim',
  customerAddressBn: 'ঢাকা',
  customerAddressEn: 'Dhaka',
  customerPhone: '01712345678',
  items: [
    {
      id: 1,
      productName: 'ট্রাক্টর পার্টস',
      unitPrice: '5000.00',
      quantity: '2',
      lineTotal: '10000.00',
      createdAt: '2026-06-25T00:00:00Z',
      updatedAt: '2026-06-25T00:00:00Z',
    },
    {
      id: 2,
      productName: 'তেল ফিল্টার',
      unitPrice: '2300.00',
      quantity: '1',
      lineTotal: '2300.00',
      createdAt: '2026-06-25T00:00:00Z',
      updatedAt: '2026-06-25T00:00:00Z',
    },
  ],
  currentBalance: '15000.00',
};

export const samplePaymentConfirmation = {
  id: 26,
  displayId: 'COM-26',
  transactionType: 'PAYMENT' as const,
  date: '2026-06-25',
  totalAmount: '5000.00',
  note: 'Partial payment',
  paymentMethod: 'cash',
  customerId: 1,
  customerNameBn: 'রহিম',
  customerNameEn: 'Rahim',
  customerAddressBn: 'ঢাকা',
  customerAddressEn: 'Dhaka',
  customerPhone: '01712345678',
  items: [],
  currentBalance: '10000.00',
};

const baseTimestamps = {
  createdAt: '2026-06-25T10:00:00Z',
  updatedAt: '2026-06-25T10:00:00Z',
};

export const sampleSaleTransaction = {
  id: sampleSaleConfirmation.id,
  customerId: sampleSaleConfirmation.customerId,
  customerNameBn: sampleSaleConfirmation.customerNameBn,
  customerNameEn: sampleSaleConfirmation.customerNameEn,
  transactionType: sampleSaleConfirmation.transactionType,
  date: sampleSaleConfirmation.date,
  amount: sampleSaleConfirmation.totalAmount,
  totalAmount: sampleSaleConfirmation.totalAmount,
  note: sampleSaleConfirmation.note,
  paymentMethod: '',
  balanceImpact: `+${sampleSaleConfirmation.totalAmount}`,
  items: sampleSaleConfirmation.items,
  createdByName: 'admin',
  ...baseTimestamps,
};

export const samplePaymentTransaction = {
  id: samplePaymentConfirmation.id,
  customerId: samplePaymentConfirmation.customerId,
  customerNameBn: samplePaymentConfirmation.customerNameBn,
  customerNameEn: samplePaymentConfirmation.customerNameEn,
  transactionType: samplePaymentConfirmation.transactionType,
  date: samplePaymentConfirmation.date,
  amount: samplePaymentConfirmation.totalAmount,
  totalAmount: samplePaymentConfirmation.totalAmount,
  note: samplePaymentConfirmation.note,
  paymentMethod: samplePaymentConfirmation.paymentMethod,
  balanceImpact: `-${samplePaymentConfirmation.totalAmount}`,
  items: [],
  createdByName: 'admin',
  ...baseTimestamps,
};

export const sampleInitialTransaction = {
  id: 99,
  customerId: 1,
  customerNameBn: 'রহিম',
  customerNameEn: 'Rahim',
  transactionType: 'INITIAL' as const,
  date: '2026-06-20',
  amount: '8000.00',
  totalAmount: '8000.00',
  note: 'Opening balance',
  paymentMethod: '',
  balanceImpact: '+8000.00',
  items: [],
  createdByName: 'admin',
  ...baseTimestamps,
};

export const transactionMswHandlers = [
  http.get('*/api/admin/transactions/:id/', ({ params }) => {
    const id = Number(params.id);
    if (id === sampleSaleTransaction.id) {
      return HttpResponse.json(sampleSaleTransaction);
    }
    if (id === samplePaymentTransaction.id) {
      return HttpResponse.json(samplePaymentTransaction);
    }
    if (id === sampleInitialTransaction.id) {
      return HttpResponse.json(sampleInitialTransaction);
    }
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'We could not find the requested resource.',
          details: {},
        },
      },
      { status: 404 },
    );
  }),
  http.get('*/api/admin/transactions/:id/confirmation/', ({ params }) => {
    const id = Number(params.id);
    if (id === sampleSaleConfirmation.id) {
      return HttpResponse.json(sampleSaleConfirmation);
    }
    if (id === samplePaymentConfirmation.id) {
      return HttpResponse.json(samplePaymentConfirmation);
    }
    if (id === 99) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIRMATION_NOT_AVAILABLE',
            message: 'Initial balance transactions do not have a printable confirmation.',
            details: {},
          },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'We could not find the requested resource.',
          details: {},
        },
      },
      { status: 404 },
    );
  }),
];
