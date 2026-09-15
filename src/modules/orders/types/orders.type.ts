export enum OrderStatus {
  REQUESTED = 'requested',
  CANCELLED = 'cancelled',
  IN_PREPARATION = 'in_preparation',
  REJECTED = 'rejected',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  ON_THE_WAY = 'on_the_way',
  ABORTED = 'aborted',
  COMPLETED = 'completed',
  RETURNED = 'returned',
}

/** online = delivery checkout; in_store = POS / counter sale (no messaging). */
export enum OrderChannel {
  ONLINE = 'online',
  IN_STORE = 'in_store',
}