"use client";

/**
 * Layer 3 · ScribeDecisionPane — DC-01 交互节点
 * 当书记员需要用户拍板时，以一组干净的选择卡呈现。
 * 文案纯人话，技术 schema 收进 Trace。
 */

import * as React from "react";

export interface DecisionOption {
  id: string;
  label: string;
  subtitle?: string;
}

export interface ScribeDecisionPaneProps {
  /** 书记员的"轻声补充"，自然语言 */
  prompt: string;
  /** 选项列表 */
  options: DecisionOption[];
  /** 用户选择回调 */
  onSelect: (optionId: string) => void;
  /** 打开 Trace 查看推理过程 */
  onTraceClick?: () => void;
}

export function ScribeDecisionPane({
  prompt,
  options,
  onSelect,
  onTraceClick,
}: ScribeDecisionPaneProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect(id);
  };

  return (
    <div className="space-y-4 rounded-md border px-5 py-4" style={{ borderColor: "#e8e1d4" }}>
      {/* Prompt */}
      <p className="text-sm font-serif leading-relaxed" style={{ color: "#5a4f44" }}>
        {prompt}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            className={`w-full rounded-md border px-4 py-3 text-left transition-all duration-150 ${
              selectedId === option.id
                ? "ring-2"
                : "hover:border-[#a8916b]/50"
            }`}
            style={{
              backgroundColor: selectedId === option.id ? "#faf6ee" : "#ffffff",
              borderColor: selectedId === option.id ? "#a8916b" : "#e8e1d4",
              ...(selectedId === option.id ? { "--tw-ring-color": "#a8916b" } as React.CSSProperties : {}),
            }}
          >
            <span className="block text-sm font-medium" style={{ color: "#3d3529" }}>
              {option.label}
            </span>
            {option.subtitle && (
              <span className="mt-0.5 block text-xs" style={{ color: "#7a6e5e" }}>
                {option.subtitle}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Trace link */}
      {onTraceClick && (
        <button
          type="button"
          onClick={onTraceClick}
          className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "#5a4f44" }}
        >
          查看书记员怎么想出这些选项的 &rsaquo;
        </button>
      )}
    </div>
  );
}
