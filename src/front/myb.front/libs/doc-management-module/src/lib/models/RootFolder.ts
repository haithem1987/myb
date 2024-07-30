import { BaseModel } from '../../../../shared/infra/models/base.model';

export interface RootFolder extends BaseModel {
  
    FolderId: number ; 
    ModuleName: string;
    UserId :string ;
    createdBy: string;
    editedBy: string;
   
    
  
  }