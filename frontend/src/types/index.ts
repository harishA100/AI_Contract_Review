export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface KeyClause {
  clause_name: string;
  text: string;
  description: string;
}

export interface PaymentTerm {
  term: string;
  details: string;
  importance: 'High' | 'Medium' | 'Low' | string;
}

export interface TerminationCondition {
  condition: string;
  details: string;
  risk_level: 'High' | 'Medium' | 'Low' | string;
}

export interface Obligation {
  party: string;
  duty: string;
  deadline: string;
}

export interface RiskItem {
  risk: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  mitigation: string;
}

export interface Analysis {
  id: string;
  contract_id: string;
  summary: string;
  risk_score: number;
  key_clauses: KeyClause[];
  payment_terms: PaymentTerm[];
  termination_conditions: TerminationCondition[];
  obligations: Obligation[];
  risk_assessment: RiskItem[];
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  user_id: string;
  title: string;
  filename: string;
  file_path: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
