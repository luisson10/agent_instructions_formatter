import { NodeViewWrapper } from '@tiptap/react';

export const VariableComponent = (props: any) => {
  return (
    <NodeViewWrapper as="span" className="inline-flex items-baseline mx-1 align-middle">
      <span 
        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 select-none cursor-default font-mono shadow-sm"
        contentEditable={false}
      >
        <span className="opacity-50 mr-1 text-[10px]">{{</span>
        {props.node.attrs.name}
        <span className="opacity-50 ml-1 text-[10px]">}}</span>
      </span>
    </NodeViewWrapper>
  );
};

