import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Copy, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { validateSingleLine } from '../../lib/transformer';
import { cn } from '../ui/Button';

export const RightEditor = () => {
  const { singleLine, setSingleLine, options, setOption, transformToMulti } = useAppStore();
  const [copyFeedback, setCopyFeedback] = useState(false);

  const validation = validateSingleLine(singleLine);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(singleLine);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSingleLine(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
       {/* Toolbar Derecha */}
       <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">MÁQUINA (SINGLE LINE)</span>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={transformToMulti} title="Reconstruir Markdown desde este texto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Reconstruir
            </Button>
            <Button 
                variant={copyFeedback ? 'primary' : 'secondary'} 
                size="sm" 
                onClick={handleCopy}
                disabled={!singleLine}
            >
                {copyFeedback ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copyFeedback ? '¡Copiado!' : 'Copiar'}
            </Button>
        </div>
      </div>

      {/* Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-slate-800/30 border-b border-slate-800">
        <Toggle 
            id="opt-normalize"
            checked={options.normalizeSpaces} 
            onCheckedChange={(v) => setOption('normalizeSpaces', v)} 
            label="Normalizar Espacios"
        />
        <Toggle 
            id="opt-quotes"
            checked={options.wrapInQuotes} 
            onCheckedChange={(v) => setOption('wrapInQuotes', v)} 
            label='Envolver en "' 
        />
        <Toggle 
            id="opt-escape"
            checked={options.escapeInternalQuotes} 
            onCheckedChange={(v) => setOption('escapeInternalQuotes', v)} 
            label='Escapar " internas' 
        />
      </div>

      {/* Error Indicator */}
      {!validation.valid && (
          <div className="bg-red-900/20 border-l-4 border-red-500 p-2 flex items-center gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{validation.error}</span>
          </div>
      )}

      {/* Área de Texto */}
      <div className="flex-1 p-0 relative">
        <textarea
            className={cn(
                "w-full h-full bg-[#0d1117] text-green-400 p-4 resize-none outline-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-all",
                !validation.valid && "ring-2 ring-inset ring-red-500/20"
            )}
            placeholder='El resultado "single line" aparecerá aquí...'
            value={singleLine}
            onChange={handleManualChange}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950 text-[10px] text-slate-500 border-t border-slate-800">
        <span>Caracteres: {singleLine.length}</span>
        {/* En single line, tokens son similares, pero escapes pueden aumentar count */}
        <span>Tokens aprox: {Math.ceil(singleLine.length / 4)}</span>
      </div>
    </div>
  );
};

