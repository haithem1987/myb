export type SignalementType =
  | 'DEGRADATION'
  | 'PANNE'
  | 'DEGATS_DES_EAUX'
  | 'ENGORGEMENT'
  | 'INCENDIE'
  | 'VANDALISME'
  | 'AUTRE';

export type SignalementZone =
  | 'LOCAL_VELO'
  | 'LOCAL_POUBELLES'
  | 'JARDINS'
  | 'ECLAIRAGES'
  | 'COULOIRS'
  | 'ASCENSEUR'
  | 'PARKING'
  | 'FACADE'
  | 'TOITURE'
  | 'AUTRES';

export type SignalementStatus = 'EN_COURS' | 'PRIS_EN_COMPTE' | 'RESOLU';

export interface Signalement {
  id: string;
  copropertyId: string;
  reportedBy: string;
  reporterName: string;
  type: SignalementType;
  zone: SignalementZone;
  description: string;
  photoUrl?: string;
  status: SignalementStatus;
  viewsCount: number;
  syndicComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSignalementInput {
  copropertyId: string;
  reportedBy: string;
  reporterName: string;
  type: string;
  zone: string;
  description: string;
  photoUrl?: string;
}

export const SIGNALEMENT_TYPE_LABELS: Record<string, string> = {
  DEGRADATION: 'Dégradation',
  PANNE: 'Panne',
  DEGATS_DES_EAUX: 'Dégats des eaux',
  ENGORGEMENT: 'Engorgement',
  INCENDIE: 'Incendie',
  VANDALISME: 'Vandalisme',
  AUTRE: 'Autre',
};

export const SIGNALEMENT_ZONE_LABELS: Record<string, string> = {
  LOCAL_VELO: 'Local vélo',
  LOCAL_POUBELLES: 'Local poubelles',
  JARDINS: 'Jardins',
  ECLAIRAGES: 'Éclairages',
  COULOIRS: 'Couloirs',
  ASCENSEUR: 'Ascenseur',
  PARKING: 'Parking',
  FACADE: 'Façade',
  TOITURE: 'Toiture',
  AUTRES: 'Autres',
};

export const SIGNALEMENT_TYPE_ICONS: Record<string, string> = {
  DEGRADATION: 'bi-tools',
  PANNE: 'bi-wrench',
  DEGATS_DES_EAUX: 'bi-droplet-fill',
  ENGORGEMENT: 'bi-filter-circle',
  INCENDIE: 'bi-fire',
  VANDALISME: 'bi-shield-exclamation',
  AUTRE: 'bi-three-dots',
};

export const SIGNALEMENT_ZONE_ICONS: Record<string, string> = {
  LOCAL_VELO: 'bi-bicycle',
  LOCAL_POUBELLES: 'bi-trash3',
  JARDINS: 'bi-tree',
  ECLAIRAGES: 'bi-lightbulb',
  COULOIRS: 'bi-door-open',
  ASCENSEUR: 'bi-arrows-vertical',
  PARKING: 'bi-p-square',
  FACADE: 'bi-building',
  TOITURE: 'bi-house-up',
  AUTRES: 'bi-three-dots',
};

export const SIGNALEMENT_STATUS_LABELS: Record<SignalementStatus, string> = {
  EN_COURS: 'En cours',
  PRIS_EN_COMPTE: 'Pris en compte',
  RESOLU: 'Résolu',
};
