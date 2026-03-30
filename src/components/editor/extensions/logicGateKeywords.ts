export interface LogicGateKeyword {
  keyword: string;
  label: string;
  description: string;
  example: string;
}

export const LOGIC_GATE_KEYWORDS: LogicGateKeyword[] = [
  {
    keyword: 'IF',
    label: 'IF',
    description: 'Condición - evalúa si se cumple una condición',
    example: 'IF hora_local < entrega_minima → USE hora_minima',
  },
  {
    keyword: 'AND',
    label: 'AND',
    description: 'Conector - une múltiples condiciones que deben cumplirse',
    example: 'IF hora > minima AND hora < cierre → USE hora',
  },
  {
    keyword: 'ELSE',
    label: 'ELSE',
    description: 'Alternativa - se ejecuta si la condición IF no se cumple',
    example: 'ELSE → USE horario_entrega',
  },
  {
    keyword: 'THEN',
    label: 'THEN',
    description: 'Consecuencia - acción que sigue después de una condición',
    example: 'IF cliente confirma THEN ejecutar pedido',
  },
  {
    keyword: 'DO',
    label: 'DO',
    description: 'Acción imperativa - ejecuta una acción específica',
    example: 'DO verificar disponibilidad',
  },
  {
    keyword: 'OMIT',
    label: 'OMIT',
    description: 'Omitir - el agente NO debe realizar esta acción',
    example: 'OMIT prometer entrega sin confirmación',
  },
  {
    keyword: 'USE',
    label: 'USE',
    description: 'Usar valor - indica qué dato o valor utilizar',
    example: 'USE entrega_minima_cilindro',
  },
  {
    keyword: 'SAY',
    label: 'SAY',
    description: 'Verbalizar - el agente debe decir exactamente este texto',
    example: 'SAY "Muy bien, espere en la línea"',
  },
  {
    keyword: 'GOTO',
    label: 'GOTO',
    description: 'Ir a - salta a un paso específico del flujo',
    example: 'GOTO paso_3',
  },
  {
    keyword: 'WAIT',
    label: 'WAIT',
    description: 'Esperar - pausa hasta que ocurra un evento',
    example: 'WAIT cliente_responde',
  },
  {
    keyword: 'CALL',
    label: 'CALL',
    description: 'Ejecutar herramienta - invoca una función o tool',
    example: 'CALL generar_pedido_gas',
  },
];
