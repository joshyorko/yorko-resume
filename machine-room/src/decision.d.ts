export type DecisionRequest = { kind: 'predicate' | 'choice' | 'score' | 'abstain'; candidates: string[] };
export type Capability = { id: string; evidence: {label:string; url:string}[] };
export type Decision = { backend:'deterministic'; kind:'abstain'; reason:string }
 | { backend:'deterministic'; kind:'choice'; selected:Capability }
 | { backend:'deterministic'; kind:'predicate'; result:boolean; selected:Capability|null }
 | { backend:'deterministic'; kind:'score'; score:0|1; selected:Capability|null };
export function decide(request:DecisionRequest, catalog:Capability[]):Decision;
