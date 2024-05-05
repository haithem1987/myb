export class BaseModel {
  id!: number;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  // any other fields that are common across entities
}
