import { z } from 'zod';

export const delegationSchema = z
  .object({
    toUserId: z.string().min(1, 'Selecione um delegado'),
    startDate: z.string().min(1, 'Selecione a data inicial'),
    endDate: z.string().min(1, 'Selecione a data final'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Data final deve ser igual ou posterior à data inicial',
    path: ['endDate'],
  });

export type DelegationFormData = z.infer<typeof delegationSchema>;
