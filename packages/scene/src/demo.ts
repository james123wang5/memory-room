import { parseScene } from './schema';

export const createDemo = () => parseScene({
  version: 1, id: 'memory-room-demo-v1', title: '午后的房间', units: 'meter',
  coordinates: 'right-handed-y-up', source: 'procedural-demo',
  assets: { 'gaussian-vase': { path: 'assets/demo-vase.ply', type: 'splat' } },
  nodes: [
    { id: 'room', name: '房间背景', kind: 'primitive', primitive: 'room', description: '程序生成的背景，用于验证场景结构。真实房间采集将在后续接入。' },
    { id: 'desk', name: '书桌', kind: 'primitive', primitive: 'desk', transform: { position: [-1.15, 0, -0.8] } },
    { id: 'chair', name: '木椅', kind: 'primitive', primitive: 'chair', interaction: 'inspect', transform: { position: [-1.1, 0, 0.48], rotation: [0, -0.25, 0] }, description: '独立演示物体。拿起后可以旋转查看，再放回原处。' },
    { id: 'cabinet', name: '矮柜', kind: 'primitive', primitive: 'cabinet', transform: { position: [1.28, 0, -1.02] } },
    { id: 'drawer', name: '上层抽屉', kind: 'primitive', primitive: 'drawer', parent: 'cabinet', interaction: 'joint',
      transform: { position: [0, 0.68, 0] }, joint: { type: 'slide', axis: [0, 0, 1], min: 0, max: 0.48, value: 0 },
      description: '沿一个方向滑动。抽屉中的书会跟随移动，也能单独拿起。' },
    { id: 'book', name: '抽屉里的书', kind: 'primitive', primitive: 'book', parent: 'drawer', interaction: 'inspect',
      transform: { position: [0, -0.015, 0.06], rotation: [0, 0.12, 0] }, description: '用于验证嵌套物品：柜子 → 抽屉 → 书。文字与记忆内容后续再接入。' },
    { id: 'door', name: '左侧柜门', kind: 'primitive', primitive: 'door', parent: 'cabinet', interaction: 'joint',
      transform: { position: [-0.57, 0.33, 0.36] }, joint: { type: 'hinge', axis: [0, -1, 0], min: 0, max: 1.75, value: 0 },
      description: '以左边缘为支点旋转。这里只演示手动定义的关节，没有自动推断转轴。' },
    { id: 'vase', name: '高斯花器', kind: 'splat', asset: 'gaussian-vase', interaction: 'inspect',
      transform: { position: [-1.55, 0.83, -0.82] }, description: '由程序生成的三维高斯模型，以真实的 Spark 高斯渲染链路加载；并非拍摄重建。可以用你自己的 PLY / SPZ / SPLAT 文件替换。' },
    { id: 'desk-book', name: '桌上的手册', kind: 'primitive', primitive: 'book', interaction: 'inspect',
      transform: { position: [-0.7, 0.845, -0.6], rotation: [0, -0.16, 0], scale: 1.15 }, description: '程序生成的演示书。用于验证独立选取、旋转和精确归位。' },
    { id: 'plant', name: '绿植', kind: 'primitive', primitive: 'plant', transform: { position: [2, 0, -1.65] } },
  ],
});
