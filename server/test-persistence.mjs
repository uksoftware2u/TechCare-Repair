const base="http://127.0.0.1:8091/api";
const list=await (await fetch(`${base}/customers`)).json();
const original=list.find((customer)=>customer.id==="CUST-000127");
const changed={...original,area:"SQL PERSISTENCE TEST"};
async function update(customer) {
  const response=await fetch(`${base}/customers/${customer.id}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(customer)});
  if(!response.ok) throw new Error(await response.text());
}
await update(changed);
const after=await (await fetch(`${base}/customers`)).json();
const persisted=after.find((customer)=>customer.id===original.id).area;
await update(original);
console.log(JSON.stringify({persisted,writePersisted:persisted==="SQL PERSISTENCE TEST",restoredArea:original.area}));
