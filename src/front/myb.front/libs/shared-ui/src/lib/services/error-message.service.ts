import { Injectable } from '@angular/core';

/**
 * User-friendly error object returned by ErrorMessageService.
 * Contains everything needed to display a helpful error message to the user.
 */
export interface UserFriendlyError {
  message: string;
  suggestion: string;
  severity: 'info' | 'warning' | 'danger';
  icon: string;
  actionLabel?: string;
  actionCallback?: () => void;
}

/**
 * Service to translate technical GraphQL/HTTP errors into user-friendly French messages.
 * Categorizes errors into 7 types and provides appropriate guidance without exposing internals.
 *
 * Error Categories:
 * 1. Validation errors
 * 2. Invoice generation errors
 * 3. Authorization/permission errors
 * 4. Resource not found (404)
 * 5. Conflict/duplicate (409)
 * 6. Server errors (5xx)
 * 7. Network errors
 * 8. Fallback/unknown errors
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorMessageService {
  /**
   * Translates a technical error (GraphQL or HTTP) into a user-friendly error message.
   * Never exposes internal error details to the user.
   */
  translateError(error: any): UserFriendlyError {
    const graphQLMessage = error?.graphQLErrors?.[0]?.message || '';
    const httpStatus = error?.status || 0;
    const networkError = error?.networkError;

    // ─── Category 1: Validation Errors ─────────────────────────────────────
    if (this.isValidationError(graphQLMessage)) {
      return {
        message: 'Les données fournies sont invalides ou incomplètes.',
        suggestion: 'Vérifiez les champs requis et le format des données, puis réessayez.',
        severity: 'warning',
        icon: 'bi-exclamation-triangle',
      };
    }

    // ─── Category 2: Invoice Generation Errors ────────────────────────────
    if (this.isInvoiceError(graphQLMessage)) {
      if (graphQLMessage.includes('duplicate') || graphQLMessage.includes('existe')) {
        return {
          message: 'Une facture existe déjà pour cet appel de fonds.',
          suggestion: 'Consultez la liste des factures pour voir les détails.',
          severity: 'info',
          icon: 'bi-info-circle',
        };
      }
      if (graphQLMessage.includes('missing') || graphQLMessage.includes('required')) {
        return {
          message: 'Certaines informations requises pour la facturation sont manquantes.',
          suggestion: 'Assurez-vous que tous les détails de l\'appel de fonds et du copropriétaire sont complets.',
          severity: 'warning',
          icon: 'bi-exclamation-circle',
        };
      }
      return {
        message: 'Impossible de générer la facture à ce moment.',
        suggestion: 'Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support.',
        severity: 'danger',
        icon: 'bi-exclamation-octagon',
      };
    }

    // ─── Category 3: Permission/Authorization Errors ──────────────────────
    if (httpStatus === 403 || graphQLMessage.includes('not authorized') || 
        graphQLMessage.includes('Permission')) {
      return {
        message: 'Vous n\'avez pas les permissions pour effectuer cette action.',
        suggestion: 'Contactez votre gestionnaire ou l\'administrateur du système.',
        severity: 'danger',
        icon: 'bi-shield-exclamation',
      };
    }

    // ─── Category 4: Resource Not Found ────────────────────────────────────
    if (httpStatus === 404 || graphQLMessage.includes('not found') || 
        graphQLMessage.includes('introuvable')) {
      return {
        message: 'Cette ressource n\'existe plus ou a été supprimée.',
        suggestion: 'Actualisez la page pour voir les données à jour.',
        severity: 'warning',
        icon: 'bi-question-circle',
      };
    }

    // ─── Category 5: Conflict/Already Processed ────────────────────────────
    if (httpStatus === 409 || graphQLMessage.includes('conflict') || 
        graphQLMessage.includes('déjà')) {
      return {
        message: 'Cette action a déjà été effectuée ou un conflit a été détecté.',
        suggestion: 'Actualisez la page pour voir les données à jour.',
        severity: 'info',
        icon: 'bi-info-circle',
      };
    }

    // ─── Category 6: Server/Backend Errors ────────────────────────────────
    if (httpStatus >= 500) {
      return {
        message: 'Une erreur serveur s\'est produite. Nous travaillons pour résoudre le problème.',
        suggestion: 'Veuillez réessayer dans quelques minutes.',
        severity: 'danger',
        icon: 'bi-exclamation-triangle-fill',
      };
    }

    // ─── Category 7: Network Errors ────────────────────────────────────────
    if (networkError || !navigator.onLine) {
      return {
        message: 'Problème de connexion réseau détecté.',
        suggestion: 'Vérifiez votre connexion Internet et réessayez.',
        severity: 'warning',
        icon: 'bi-wifi-off',
      };
    }

    // ─── Category 8: Fallback/Unknown Errors ──────────────────────────────
    return {
      message: 'Une erreur inattendue s\'est produite.',
      suggestion: 'Veuillez réessayer ou contactez le support si le problème persiste.',
      severity: 'danger',
      icon: 'bi-exclamation-circle',
    };
  }

  /**
   * Translates an error that occurred during invoice generation. Ensures the
   * user never sees raw HTTP/GraphQL error messages; the returned message is
   * always plain French and the technical details are logged separately.
   */
  translateInvoiceError(error: any): UserFriendlyError {
    console.error('[Invoice] Technical error (hidden from user):', error);
    const base = this.translateError(error);
    // Override the generic message to be specific to the invoice flow.
    return {
      ...base,
      message: 'La génération de la facture a échoué.',
      suggestion: base.severity === 'warning'
        ? 'Vérifiez les informations de l\'appel de fonds et réessayez.'
        : 'Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support.',
    };
  }

  /**
   * Checks if an error message indicates a validation error.
   */
  private isValidationError(message: string): boolean {
    const validationPatterns = [
      'VALIDATION',
      'invalid',
      'required',
      'not a valid',
      'format',
      'invalid_input',
    ];
    const lowerMsg = message.toLowerCase();
    return validationPatterns.some(pattern => lowerMsg.includes(pattern.toLowerCase()));
  }

  /**
   * Checks if an error message is related to invoice generation.
   */
  private isInvoiceError(message: string): boolean {
    const invoicePatterns = [
      'invoice',
      'facture',
      'billing',
      'facturation',
    ];
    const lowerMsg = message.toLowerCase();
    return invoicePatterns.some(pattern => lowerMsg.includes(pattern.toLowerCase()));
  }
}
