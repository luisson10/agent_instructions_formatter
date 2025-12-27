import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { LeftEditor } from './components/editor/LeftEditor';
import { RightEditor } from './components/editor/RightEditor';
import { FileCode2 } from 'lucide-react';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* App Header */}
      <header className="h-14 flex items-center px-4 border-b border-slate-800 bg-slate-900 shadow-md z-10">
        <div className="flex items-center gap-2 text-indigo-400">
            <FileCode2 className="w-6 h-6" />
            <h1 className="text-lg font-bold tracking-tight text-slate-100">Prompt Architect</h1>
        </div>
        <div className="ml-auto text-xs text-slate-500 hidden sm:block">
            Editor de Instrucciones para LLMs
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="persistence">
            {/* Panel Izquierdo */}
            <Panel defaultSize={50} minSize={20} className="flex flex-col">
                <LeftEditor />
            </Panel>

            {/* Handle Resize */}
            <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 transition-colors cursor-col-resize flex items-center justify-center group z-20">
                <div className="h-8 w-1 bg-slate-600 rounded-full group-hover:bg-indigo-300" />
            </PanelResizeHandle>

            {/* Panel Derecho */}
            <Panel defaultSize={50} minSize={20} className="flex flex-col">
                <RightEditor />
            </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

export default App;
