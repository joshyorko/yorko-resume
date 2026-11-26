// Exact public capability lookup. No inference engine or learned scores.
export function decide(request,catalog){
 const abstain=reason=>({backend:'deterministic',kind:'abstain',reason});
 if(!Array.isArray(request?.candidates)||request.candidates.length!==1)return abstain('One exact capability ID is required.');
 const record=catalog.find(c=>c.id===request.candidates[0]&&c.evidence.length);
 const selected=record?{id:record.id,evidence:record.evidence}:null;
 switch(request.kind){
 case 'choice':return selected?{backend:'deterministic',kind:'choice',selected}:abstain('No evidenced match.');
 case 'predicate':return {backend:'deterministic',kind:'predicate',result:!!selected,selected};
 case 'score':return {backend:'deterministic',kind:'score',score:selected?1:0,selected};
 default:return abstain('No selection requested.');
 }
}
