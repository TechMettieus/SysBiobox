export interface ProductionLine {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  currentOrder?: string;
  operatorId?: string;
  operatorName?: string;
  efficiency: number; // percentage
  dailyTarget: number;
  dailyProduced: number;
  lastUpdate: Date;
}

export interface ProductionStage {
  id: string;
  name: string;
  order: number;
  estimatedTime: number; // in minutes
  requiredSkills: string[];
  description: string;
}

export interface ProductionTask {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  customerId: string;
  customerName: string;
  stage: ProductionStage['id'];
  stageOrder: number;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedOperator?: string;
  startTime?: Date;
  estimatedCompletionTime?: Date;
  actualCompletionTime?: Date;
  progress: number; // percentage
  notes?: string;
  issues?: ProductionIssue[];
  qualityChecks?: QualityCheck[];
}

export interface ProductionIssue {
  id: string;
  taskId: string;
  type: 'quality' | 'material' | 'equipment' | 'operator' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface QualityCheck {
  id: string;
  taskId: string;
  checkpointName: string;
  status: 'passed' | 'failed' | 'pending';
  inspector: string;
  checkedAt: Date;
  notes?: string;
  photos?: string[];
}

export interface Operator {
  id: string;
  name: string;
  skills: string[];
  experience: number; // years
  efficiency: number; // percentage
  currentTask?: string;
  status: 'available' | 'busy' | 'break' | 'absent';
  shift: 'morning' | 'afternoon' | 'night';
}

export const productionStages: ProductionStage[] = [
  {
    id: 'design',
    name: 'Design e Medidas',
    order: 1,
    estimatedTime: 30,
    requiredSkills: ['design', 'measurement'],
    description: 'Criação do projeto e tomada de medidas'
  },
  {
    id: 'cutting',
    name: 'Corte de Materiais',
    order: 2,
    estimatedTime: 60,
    requiredSkills: ['cutting', 'material_handling'],
    description: 'Corte de madeira, tecidos e espumas'
  },
  {
    id: 'frame_assembly',
    name: 'Montagem da Estrutura',
    order: 3,
    estimatedTime: 120,
    requiredSkills: ['carpentry', 'assembly'],
    description: 'Montagem da estrutura de madeira'
  },
  {
    id: 'upholstery',
    name: 'Estofamento',
    order: 4,
    estimatedTime: 180,
    requiredSkills: ['upholstery', 'sewing'],
    description: 'Aplicação de espuma e revestimento'
  },
  {
    id: 'finishing',
    name: 'Acabamento',
    order: 5,
    estimatedTime: 90,
    requiredSkills: ['finishing', 'detail_work'],
    description: 'Acabamentos finais e detalhes'
  },
  {
    id: 'quality_control',
    name: 'Controle de Qualidade',
    order: 6,
    estimatedTime: 30,
    requiredSkills: ['quality_control'],
    description: 'Inspeção final e aprovação'
  },
  {
    id: 'packaging',
    name: 'Embalagem',
    order: 7,
    estimatedTime: 45,
    requiredSkills: ['packaging'],
    description: 'Embalagem para transporte'
  }
];


export const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  paused: 'Pausado',
  blocked: 'Bloqueado'
};

export const statusColors = {
  pending: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-biobox-green/10 text-biobox-green border-biobox-green/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  blocked: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500'
};

export const operatorStatusColors = {
  available: 'bg-biobox-green/10 text-biobox-green border-biobox-green/20',
  busy: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  break: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  absent: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export const operatorStatusLabels = {
  available: 'Disponível',
  busy: 'Ocupado',
  break: 'Pausa',
  absent: 'Ausente'
};
