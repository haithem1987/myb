import gql from 'graphql-tag';

export const CREATE_INVOICE = gql`
  mutation AddInvoice($item: InvoiceModelInput!) {
    addInvoice(invoice: $item) {
      invoiceNum
      invoiceDate
      subTotal
      totalAmount
      dueDate
      status
      createdAt
      updatedAt
      clientName
      clientAddress
      supplierName
      supplierAddress
      userId
      companyId
    }
  }
`;
