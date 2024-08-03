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
