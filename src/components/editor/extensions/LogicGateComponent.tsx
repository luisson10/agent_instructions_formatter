import { NodeViewWrapper } from '@tiptap/react';

export const LogicGateComponent = (props: any) => {
  return (
    <NodeViewWrapper as="span" className="inline-flex items-baseline mx-1 align-middle">
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800 select-none cursor-default font-mono shadow-sm"
        contentEditable={false}
      >
        {props.node.attrs.keyword}
      </span>
    </NodeViewWrapper>
  );
};
