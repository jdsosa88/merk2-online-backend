export enum BusinessStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  DISABLED = 'disabled',
}

export enum MessengerAssigmentType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
};

export type BusinessStatusType = BusinessStatus;