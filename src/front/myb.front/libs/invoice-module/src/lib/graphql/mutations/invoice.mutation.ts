import gql from 'graphql-tag';

export const CREATE_INVOICE = gql`
  mutation AddInvoice($item: InvoiceModelInput!) {
    addInvoice(invoice: $item) {
      clientID
      companyId
      createdAt
      dueDate
      id
      image
      isArchived
      invoiceDate
      invoiceNum
      status
      subTotal
      totalAmount
      updatedAt
      userId
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


export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($item: InvoiceModelInput!) {
    updateInvoice(invoice: $item) {
      clientID
      companyId
      createdAt
      dueDate
      id
      image
      isArchived
      invoiceDate
      invoiceNum
      status
      subTotal
      totalAmount
      updatedAt
      userId
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
