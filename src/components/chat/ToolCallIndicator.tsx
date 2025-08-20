"use client";

import { Loader2, FileText, Edit3, FolderPlus, Trash2 } from "lucide-react";

interface ToolCallIndicatorProps {
  toolName: string;
  args: any;
  state: "call" | "result";
}

function getToolMessage(toolName: string, args: any): { message: string; icon: React.ReactNode } {
  if (!args) {
    return {
      message: toolName,
      icon: <Edit3 className="w-3 h-3" />
    };
  }

  switch (toolName) {
    case "str_replace_editor": {
      const { command, path } = args;
      
      if (command === "create" && path) {
        return {
          message: `Creating file ${path}`,
          icon: <FileText className="w-3 h-3" />
        };
      }
      
      if (command === "str_replace" && path) {
        return {
          message: `Editing file ${path}`,
          icon: <Edit3 className="w-3 h-3" />
        };
      }
      
      if (command === "insert" && path) {
        return {
          message: `Updating file ${path}`,
          icon: <Edit3 className="w-3 h-3" />
        };
      }
      
      return {
        message: "Editing code",
        icon: <Edit3 className="w-3 h-3" />
      };
    }
    
    case "file_manager": {
      const { command, path, new_path } = args;
      
      if (command === "rename" && path && new_path) {
        return {
          message: `Renaming ${path} to ${new_path}`,
          icon: <Edit3 className="w-3 h-3" />
        };
      }
      
      if (command === "delete" && path) {
        return {
          message: `Deleting ${path}`,
          icon: <Trash2 className="w-3 h-3" />
        };
      }
      
      if (command === "create" && path) {
        return {
          message: `Creating ${path}`,
          icon: <FolderPlus className="w-3 h-3" />
        };
      }
      
      return {
        message: "Managing files",
        icon: <Edit3 className="w-3 h-3" />
      };
    }
    
    default:
      return {
        message: toolName,
        icon: <Edit3 className="w-3 h-3" />
      };
  }
}

export function ToolCallIndicator({ toolName, args, state }: ToolCallIndicatorProps) {
  const { message, icon } = getToolMessage(toolName, args);
  
  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {state === "result" ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {icon}
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          {icon}
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}