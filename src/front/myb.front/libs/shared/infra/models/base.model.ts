export class BaseModel {
  id!: number;
  createdAt?: Date | null = new Date();
  updatedAt?: Date | null = new Date();
  // any other fields that are common across entities
}
