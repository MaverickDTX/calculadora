import { HelpCircle } from 'lucide-react';

interface Props {
  /** Texto de ajuda exibido no tooltip. */
  text: string;
}

/**
 * Ícone de ajuda com tooltip no padrão do app (classe .tooltip do index.css).
 * Sinaliza visualmente que o campo tem explicação. Acessível: focável por teclado
 * (tabIndex=0), tooltip aparece em :hover e :focus-within, aria-label para leitores.
 */
export function HelpTip({ text }: Props) {
  return (
    <span
      className="tooltip inline-flex align-middle ml-1 text-text-muted hover:text-text-secondary cursor-help"
      data-tip={text}
      role="img"
      aria-label={`Ajuda: ${text}`}
      tabIndex={0}
    >
      <HelpCircle size={13} aria-hidden="true" />
    </span>
  );
}
