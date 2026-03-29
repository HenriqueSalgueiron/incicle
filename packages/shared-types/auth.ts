export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  companies: Company[];
}

export interface ApprovalItem {
  id: string;
  instanceId: string;
  title: string;
  currentStep: string;
  requester: { id: string; name: string };
  slaDeadline: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/** Props passed from shell to remote across the MF boundary */
export interface RemoteAppProps {
  user: User;
  token: string;
  currentCompanyId: string;
  companies: Company[];
  onCompanyChange: (companyId: string) => void;
}
