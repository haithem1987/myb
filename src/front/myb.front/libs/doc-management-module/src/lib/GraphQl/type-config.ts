import { GET_ALL_DOCUMENTS , GET_DOCUMENT_BY_ID } from "./Queries/Document.graphql"
import { CREATE_DOCUMENT , UPDATE_DOCUMENT ,DELETE_DOCUMENT} from "./Mutations/DocumentMutation"






export const typeConfig :{[key: string]: any} = {
    DocumentModel:{
        getById: GET_DOCUMENT_BY_ID,
        getAll: GET_ALL_DOCUMENTS,
        update: UPDATE_DOCUMENT,
        delete: DELETE_DOCUMENT,
        create: CREATE_DOCUMENT,
    
      }
}

