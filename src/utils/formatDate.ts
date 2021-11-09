import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export function formatDate(date: string, mask = 'dd MMM yyyy'): string {
  return format(
    new Date(date), 
    mask, 
    { 
      locale: ptBR 
    }
  );
}