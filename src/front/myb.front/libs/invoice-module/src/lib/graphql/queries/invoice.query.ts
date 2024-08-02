import gql from 'graphql-tag';

export const GET_ALL_INVOICES = gql`
  query GetAllInvoices {
    allInvoices {
      clientID
      companyId
      createdAt
      dueDate
      id
      image
      invoiceDate
      invoiceNum
      status
      subTotal
      totalAmount
      updatedAt
      userId
      invoiceDetails {
        createdAt
        id
        invoiceID
        productId
        quantity
        totalPrice
        unitPrice
        updatedAt
      }
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
