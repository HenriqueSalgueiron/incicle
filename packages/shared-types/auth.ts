export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Company {
  id: string;
  name: string;
}

/** Props passed from shell to remote across the MF boundary */
export interface RemoteAppProps {
  user: User;
  token: string;
  currentCompanyId: string;
  companies: Company[];
  onCompanyChange: (companyId: string) => void;
}
