import { GET_ALL_INVOICES, GET_INVOICE_BY_ID } from './queries/invoice.query';

export const typeConfig: { [key: string]: any } = {
  Invoice: {
    getAll: GET_ALL_INVOICES,
    getById: GET_INVOICE_BY_ID,
  },
};
