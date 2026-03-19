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

export interface UploadImageParams {
  businessId: string;
  picFiles?: Express.Multer.File[];
  portalPicFiles?: Express.Multer.File[];
}

export type ImageToDeleteType = "pic" | "portalPic" | "both";

export interface DeleteImageParams {
  businessId: string;
  imageToDelete: ImageToDeleteType;
}