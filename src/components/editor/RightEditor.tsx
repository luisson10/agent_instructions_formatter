import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Copy, AlertTriangle, CheckCircle2, ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { validateOutputQuality } from '../../lib/transformer';
import { cn } from '../ui/Button';

export const RightEditor = () => {
  const { singleLine, setSingleLine, applySingleLineInput, options, setOption, transformToMulti } = useAppStore();
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Usamos el validador nuevo
  const validation = validateOutputQuality(singleLine);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(singleLine);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSingleLine(e.target.value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;
    e.preventDefault();
    applySingleLineInput(pastedText);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
       {/* Toolbar Derecha */}
       <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">MÁQUINA (SINGLE LINE)</span>
          
          {/* Badge de Validación */}
          {singleLine && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
              validation.status === 'success' ? "bg-emerald-950/50 border-emerald-800 text-emerald-400" :
              validation.status === 'warning' ? "bg-amber-950/50 border-amber-800 text-amber-400" :
              "bg-red-950/50 border-red-800 text-red-400"
            )}>
              {validation.status === 'success' ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  <span>Válido</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3" />
                  <span>{validation.status === 'error' ? 'Error' : 'Revisar'}</span>
                </>
              )}
            </div>
          )}
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
                disabled={!singleLine || validation.status === 'error'}
            >
                {copyFeedback ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copyFeedback ? '¡Copiado!' : 'Copiar'}
            </Button>
        </div>
      </div>

      {/* Configuración */}
      <div className="flex items-center gap-4 p-3 bg-slate-800/30 border-b border-slate-800">
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
        {/* Toggle de escape interno eliminado a petición. Asumimos siempre true o default del transformer. */}
      </div>

      {/* Mensaje de Error/Warning Detallado */}
      {validation.status !== 'success' && singleLine && (
          <div className={cn(
            "border-l-4 p-2 flex items-center gap-2 text-xs",
            validation.status === 'error' ? "bg-red-900/20 border-red-500 text-red-200" : "bg-amber-900/20 border-amber-500 text-amber-200"
          )}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{validation.message}</span>
          </div>
      )}

      {/* Área de Texto */}
      <div className="flex-1 p-0 relative">
        <textarea
            className={cn(
                "w-full h-full bg-[#0d1117] text-green-400 p-4 resize-none outline-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-all",
                validation.status === 'error' && "ring-2 ring-inset ring-red-500/20",
                validation.status === 'warning' && "ring-2 ring-inset ring-amber-500/20"
            )}
            placeholder='El resultado "single line" aparecerá aquí...'
            value={singleLine}
            onChange={handleManualChange}
            onPaste={handlePaste}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950 text-[10px] text-slate-500 border-t border-slate-800">
        <span>Caracteres: {singleLine.length}</span>
        <span>Tokens aprox: {Math.ceil(singleLine.length / 4)}</span>
      </div>
    </div>
  );
};
