import { config } from '../services/config';
import { useAppStore } from '../store/useAppStore';

/** Pro ativo: pagamento ainda desligado (beta), assinatura nas lojas ou modo de teste. */
export function usePro(): boolean {
  const settings = useAppStore((s) => s.settings);
  return !config.paywallEnabled || Boolean(settings.proOverride || settings.proActive);
}
