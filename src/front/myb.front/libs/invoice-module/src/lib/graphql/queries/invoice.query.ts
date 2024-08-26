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
      isArchived
      invoiceDetails {
        createdAt
        description
        id
        invoiceID
        productId
        quantity
        unitPrice
        unitPriceHT
        updatedAt
        unit
      }
    }
  }
`;

export const GET_INVOICE_BY_ID = gql`
  query InvoiceByID($id: Int!) {
    invoiceByID(id: $id) {
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
      isArchived
      invoiceDetails {
        createdAt
        description
        id
        invoiceID
        productId
        quantity
        unitPrice
        unitPriceHT
        updatedAt
        unit
      }
    }
  }
`;
