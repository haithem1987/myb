import { BaseModel } from '../../../../shared/infra/models/base.model';

export interface RootFolder extends BaseModel {
  
    folderId: number ; 
    moduleName: string;
    userId :string ;
   
   
    
  
  }