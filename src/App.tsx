import { useRef, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { LeftEditor } from './components/editor/LeftEditor';
import { RightEditor } from './components/editor/RightEditor';
import { PromptLibrary } from './components/library/PromptLibrary';
import { useLibraryStore } from './store/useLibraryStore';
import { FileCode2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function App() {
  const sidebarOpen = useLibraryStore((s) => s.sidebarOpen);
  const setSidebarOpen = useLibraryStore((s) => s.setSidebarOpen);
  const sidebarRef = useRef<ImperativePanelHandle>(null);

  const handleSidebarCollapse = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  const handleSidebarExpand = useCallback(() => {
    setSidebarOpen(true);
  }, [setSidebarOpen]);

  const toggleSidebar = useCallback(() => {
    const panel = sidebarRef.current;
    if (!panel) return;
    if (sidebarOpen) {
      panel.collapse();
    } else {
      panel.expand();
    }
  }, [sidebarOpen]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans">

      {/* App Header */}
      <header className="h-14 flex items-center px-4 border-b border-slate-800 bg-slate-900 shadow-md z-10">
        <button
          onClick={toggleSidebar}
          className="mr-3 p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          title={sidebarOpen ? 'Ocultar libreria' : 'Mostrar libreria'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>
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
            {/* Sidebar */}
            <Panel
              ref={sidebarRef}
              defaultSize={15}
              minSize={12}
              maxSize={25}
              collapsible
              onCollapse={handleSidebarCollapse}
              onExpand={handleSidebarExpand}
              className="flex flex-col"
            >
                <PromptLibrary />
            </Panel>

            <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 transition-colors cursor-col-resize flex items-center justify-center group z-20">
                <div className="h-8 w-1 bg-slate-600 rounded-full group-hover:bg-indigo-300" />
            </PanelResizeHandle>

            {/* Panel Izquierdo */}
            <Panel defaultSize={42} minSize={20} className="flex flex-col">
                <LeftEditor />
            </Panel>

            {/* Handle Resize */}
            <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 transition-colors cursor-col-resize flex items-center justify-center group z-20">
                <div className="h-8 w-1 bg-slate-600 rounded-full group-hover:bg-indigo-300" />
            </PanelResizeHandle>

            {/* Panel Derecho */}
            <Panel defaultSize={43} minSize={20} className="flex flex-col">
                <RightEditor />
            </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

export default App;
