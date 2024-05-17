import gql from 'graphql-tag';

export const GET_ALL_INVOICES = gql`
  query GetAllInvoices {
    allInvoices {
      id
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

export const GET_INVOICE_BY_ID = gql`
  query invoiceById($id: Int!) {
    invoiceByID(id: $id) {
      id
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
