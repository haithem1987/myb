import { gql } from 'apollo-angular';

export const GET_TREASURY_DASHBOARD = gql`
  query GetTreasuryDashboard($copropertyId: UUID!, $months: Int) {
    treasuryDashboard(copropertyId: $copropertyId, months: $months) {
      copropertyId
      copropertyName
      realTreasury {
        openingBalance
        totalEncaissements
        totalDecaissements
        currentBalance
      }
      accountingTreasury {
        totalChargesEngaged
        totalInvoiced
        totalCollected
        totalOutstanding
        totalOverdue
        accountingBalance
      }
      workingCapitalGap
      collectionRate
      evolution {
        month
        date
        amount
      }
      expensesByType {
        category
        amount
        percentage
      }
    }
  }
`;

export const GET_UNPAID_PAYMENTS_SUMMARY = gql`
  query GetUnpaidPaymentsSummary($copropertyId: UUID!) {
    unpaidPaymentsSummary(copropertyId: $copropertyId) {
      copropertyId
      totalOwners
      ownersWithOverdue
      totalOverdueInvoices
      totalOverdueAmount
      totalPendingAmount
      averageDaysOverdue
      ownerSummaries {
        ownerId
        ownerName
        email
        phone
        unitNumbers
        totalDue
        totalPaid
        totalOutstanding
        totalOverdue
        overdueInvoiceCount
        pendingInvoiceCount
        oldestOverdueDate
        daysOverdue
        healthStatus
        invoices {
          invoiceId
          invoiceNumber
          unitNumber
          chargeName
          amount
          paidAmount
          remainingAmount
          dueDate
          daysLate
          status
          reminderLevel
        }
      }
    }
  }
`;

export const GET_OWNER_PAYMENT_SUMMARY = gql`
  query GetOwnerPaymentSummary($ownerId: UUID!, $copropertyId: UUID) {
    ownerPaymentSummary(ownerId: $ownerId, copropertyId: $copropertyId) {
      ownerId
      ownerName
      email
      phone
      unitNumbers
      totalDue
      totalPaid
      totalOutstanding
      totalOverdue
      overdueInvoiceCount
      pendingInvoiceCount
      oldestOverdueDate
      daysOverdue
      healthStatus
      invoices {
        invoiceId
        invoiceNumber
        unitNumber
        chargeName
        amount
        paidAmount
        remainingAmount
        dueDate
        daysLate
        status
        reminderLevel
      }
    }
  }
`;
