// Generate a small wasm module without a compiler dependency. decide(approved,
// revision, approvedRevision, now, expires, alreadyClaimed) returns a reason code.
export function policyBytes(){
 const section=(id,bytes)=>[id,bytes.length,...bytes],get=i=>[0x20,i];
 const rules=[
  [[...get(0),0x45],1], // i32.eqz
  [[...get(1),...get(2),0x47],2], // i32.ne
  [[...get(3),...get(4),0x4f],3], // i32.ge_u
  [get(5),4]
 ];
 const body=[0,...rules.flatMap(([test,reason])=>[...test,0x04,0x40,0x41,reason,0x0f,0x0b]),0x41,0,0x0b];
 return Uint8Array.from([0,97,115,109,1,0,0,0,...section(1,[1,96,6,...Array(6).fill(127),1,127]),...section(3,[1,0]),...section(7,[1,6,...Buffer.from('decide'),0,0]),...section(10,[1,body.length,...body])]);
}
