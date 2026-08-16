import test from "node:test";
import assert from "node:assert/strict";
import { closePool, getPool, sql } from "../server/db.mjs";

const api=process.env.TEST_API_URL||"http://127.0.0.1:8091";
async function request(path,options={}){const response=await fetch(`${api}${path}`,{...options,headers:{"content-type":"application/json","x-audit-user":"System%20QA",...(options.headers||{})}});const data=await response.json();if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);return data;}

test("creates one linked Repair and rejects a duplicate handoff",async()=>{
  let requestNo="",repairNo="";
  try{
    const customers=await request("/api/customers");
    assert.ok(customers[0]?.id,"A customer is required for workflow QA");
    const created=await request("/api/onsite-service",{method:"POST",body:JSON.stringify({customerId:customers[0].id,receivedVia:"Phone",method:"Pickup for Workshop",problem:"Temporary Onsite Service workflow QA",deviceType:"Laptop",brand:"QA",model:"Temporary",serial:`QA-${crypto.randomUUID()}`,address:"Temporary QA address",coordinator:"System QA",assignedPerson:"System QA",nextAction:"QA only"})});
    requestNo=created.no;assert.match(requestNo,/^SVR-\d{8}-\d{3}$/);
    const linked=await request(`/api/onsite-service/${encodeURIComponent(requestNo)}/create-repair`,{method:"POST",body:JSON.stringify({technician:"System QA"})});
    repairNo=linked.repairNo;assert.match(repairNo,/^SR-\d{8}-\d{3}$/);
    await assert.rejects(()=>request(`/api/onsite-service/${encodeURIComponent(requestNo)}/create-repair`,{method:"POST",body:"{}"}),/already has a linked Repair/);
  }finally{
    if(requestNo||repairNo){const pool=await getPool();if(requestNo)await pool.request().input("no",sql.NVarChar(30),requestNo).query("DELETE dbo.ServiceRequests WHERE RequestNo=@no");if(repairNo)await pool.request().input("repair",sql.NVarChar(30),repairNo).query("DELETE dbo.Repairs WHERE RepairNo=@repair");await closePool();}
  }
});
