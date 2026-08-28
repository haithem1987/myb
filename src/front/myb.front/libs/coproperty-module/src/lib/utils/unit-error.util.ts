export type UnitAction = 'create' | 'update' | 'delete';

export interface UnitErrorTranslation {
  key: string;
  params?: Record<string, string | number>;
}

/**
 * Converts the different error shapes returned by Apollo and Angular HTTP into
 * stable translation keys. Raw backend and transport details must stay in the
 * console and must never be shown directly to the user.
 */
export function getUnitErrorTranslation(
  error: any,
  action: UnitAction,
  unitNumber: string
): UnitErrorTranslation {
  const messages = [
    ...(error?.graphQLErrors ?? []).map((item: any) => item?.message),
    ...(error?.error?.errors ?? []).map((item: any) => item?.message),
    ...(error?.networkError?.error?.errors ?? []).map((item: any) => item?.message),
    error?.message,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const status = Number(
    error?.networkError?.statusCode ??
      error?.networkError?.status ??
      error?.status ??
      error?.error?.status ??
      0
  );
  const params = { unitNumber };

  if (messages.includes('already exists') || messages.includes('duplicate')) {
    return { key: 'coproperty.messages.unitDuplicate', params };
  }

  if (messages.includes('total unit shares cannot exceed coproperty total shares')) {
    const totalShares = messages.match(/total shares \((\d+)\)/)?.[1];
    return {
      key: 'coproperty.messages.unitSharesExceeded',
      params: { ...params, totalShares: totalShares ? Number(totalShares) : '' },
    };
  }

  if (messages.includes('associated with one or more owners')) {
    return { key: 'coproperty.messages.unitDeleteBlockedDueToOwners', params };
  }

  if (
    status === 401 ||
    status === 403 ||
    messages.includes('not authorized') ||
    messages.includes('forbidden')
  ) {
    return { key: 'coproperty.messages.unitPermissionDenied', params };
  }

  if (status === 404 || messages.includes('not found')) {
    return { key: 'coproperty.messages.unitNotFound', params };
  }

  if (status === 405 || messages.includes('405')) {
    return { key: 'coproperty.messages.unitServiceUnavailable', params };
  }

  if (status >= 500) {
    return { key: 'coproperty.messages.unitServerError', params };
  }

  if (
    error?.networkError ||
    error?.status === 0 ||
    messages.includes('network') ||
    messages.includes('failed to fetch')
  ) {
    return { key: 'coproperty.messages.unitNetworkError', params };
  }

  const fallbackKeys: Record<UnitAction, string> = {
    create: 'coproperty.messages.unitCreateFailed',
    update: 'coproperty.messages.unitUpdateFailed',
    delete: 'coproperty.messages.unitDeleteFailed',
  };

  return { key: fallbackKeys[action], params };
}
