export class User {
  constructor(public id: number, public name: string, public email: string) {}
}
export interface IIdentity {
  id?: number | string;
  __typename?: string;
}
