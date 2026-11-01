import { z } from 'zod';

// All providers converge on the same scene/asset contract. Reserved entries cannot run.
export const providerCatalog = [
  { id:'desktop-ooosplat', title:'Mac · OOOSplat', availability:'handoff', input:'ordered-images', output:['ply'], action:'/api/mac-reconstruction', message:'通过已有照片交接入口生成，支持版本可连接本地 MCP' },
  { id:'remote-cuda', title:'学校服务器 · CUDA / A40', availability:'planned', input:'ordered-images', output:['ply'], message:'保留远程任务与成果回传契约，尚未连接学校服务器' },
  { id:'mobile-local', title:'手机本地生成', availability:'reserved', input:'capture-package', output:['ply','spz'], message:'接口预留，本期不实现生成' },
  { id:'commercial-api', title:'商业生成服务', availability:'reserved', input:'capture-package', output:['ply','spz','glb'], message:'接口预留，本期不调用、不存储密钥' },
] as const;
export const reconstructionRequestSchema = z.object({
  sceneId:z.string().min(1).max(100), captureId:z.string().max(100).optional(),
  provider:z.enum(['desktop-ooosplat','remote-cuda','mobile-local','commercial-api']),
  purpose:z.enum(['room','object','clean-background']).default('room'),
  quality:z.enum(['preview','balanced','detail']).default('balanced'),
  notes:z.string().max(2000).default(''),
}).strict();
export type ReconstructionRequest = z.infer<typeof reconstructionRequestSchema>;
export type ReconstructionProgress = {
  requestId:string; state:'draft'|'queued'|'running'|'completed'|'failed'|'cancelled';
  stage?:'transfer'|'registration'|'training'|'export'; stagePercent?:number;
  elapsedSeconds?:number; remainingSeconds?:number; message:string;
};
export type ReconstructionArtifact = {
  requestId:string; captureId?:string; assetId:string; path:string; format:'ply'|'spz'|'glb';
  scaleStatus:'unknown'|'capture-metric'|'user-confirmed'; metersPerUnit?:number;
  provenance:'captured'|'generated'; warnings:string[];
};
export interface ReconstructionProvider {
  submit(request:ReconstructionRequest):Promise<{requestId:string}>;
  status(requestId:string):Promise<ReconstructionProgress>;
  cancel(requestId:string):Promise<void>;
  artifacts(requestId:string):Promise<ReconstructionArtifact[]>;
}
