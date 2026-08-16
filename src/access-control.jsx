import { createContext, useContext } from "react";

const AccessContext=createContext({can:()=>true,user:{id:"",name:"",role:""},updateProfile:()=>{}});

export const AccessProvider=AccessContext.Provider;
export function useAccess(){return useContext(AccessContext);}
