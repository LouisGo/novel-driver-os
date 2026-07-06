import { InputStatus, InputType, StorycraftKind } from "./schemas.js";

export const inputTypeLabels: Record<InputType, string> = {
  inspiration: "灵感",
  chapter: "章节正文",
  fragment: "正文片段",
  book_profile: "书名/简介",
  outline: "大纲",
  setting: "设定",
  character: "人设",
  worldbuilding: "世界观",
  ambiguity: "有意留白",
  style_feedback: "文风反馈",
  learning_sample: "样本学习",
  discarded_idea: "废案",
  rewrite_request: "重写/比稿",
  chapter_variant: "章节版本",
  feedback: "反馈",
  unknown: "待判断",
};

export const inputStatusLabels: Record<InputStatus, string> = {
  raw: "已收到原文",
  triaged: "已初步判断",
  routed: "已建议下一步",
  processed: "已处理",
  pending_confirmation: "等待确认",
  approved_pending_apply: "已确认，待写入",
  applied: "已写入",
  archived: "已归档",
  ignored: "已忽略",
};

export const storycraftKindLabels: Record<StorycraftKind, string> = {
  premise: "创作方向",
  payoff: "爽点设计",
  emotion: "情绪节奏",
  brief: "章节作战简报",
};

export function inputTypeLabel(type: InputType | string): string {
  return inputTypeLabels[type as InputType] ?? type;
}

export function inputStatusLabel(status: InputStatus | string): string {
  return inputStatusLabels[status as InputStatus] ?? status;
}

export function storycraftKindLabel(kind: StorycraftKind | string): string {
  return storycraftKindLabels[kind as StorycraftKind] ?? kind;
}
