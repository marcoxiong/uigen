import { render, screen } from "@testing-library/react";
import { ToolCallIndicator } from "../ToolCallIndicator";

describe("ToolCallIndicator", () => {
  describe("str_replace_editor tool", () => {
    it("shows 'Creating file' message for create command", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx", file_text: "content" }}
          state="call"
        />
      );

      expect(screen.getByText("Creating file /App.jsx")).toBeInTheDocument();
    });

    it("shows 'Editing file' message for str_replace command", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={{ command: "str_replace", path: "/App.jsx", old_str: "old", new_str: "new" }}
          state="result"
        />
      );

      expect(screen.getByText("Editing file /App.jsx")).toBeInTheDocument();
    });

    it("shows 'Updating file' message for insert command", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={{ command: "insert", path: "/App.jsx", insert_line: 5, new_str: "code" }}
          state="call"
        />
      );

      expect(screen.getByText("Updating file /App.jsx")).toBeInTheDocument();
    });

    it("shows generic 'Editing code' message for unknown command", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={{ command: "unknown" }}
          state="call"
        />
      );

      expect(screen.getByText("Editing code")).toBeInTheDocument();
    });
  });

  describe("file_manager tool", () => {
    it("shows 'Renaming' message for rename command", () => {
      render(
        <ToolCallIndicator
          toolName="file_manager"
          args={{ command: "rename", path: "/old.jsx", new_path: "/new.jsx" }}
          state="result"
        />
      );

      expect(screen.getByText("Renaming /old.jsx to /new.jsx")).toBeInTheDocument();
    });

    it("shows 'Deleting' message for delete command", () => {
      render(
        <ToolCallIndicator
          toolName="file_manager"
          args={{ command: "delete", path: "/App.jsx" }}
          state="call"
        />
      );

      expect(screen.getByText("Deleting /App.jsx")).toBeInTheDocument();
    });

    it("shows 'Creating' message for create command", () => {
      render(
        <ToolCallIndicator
          toolName="file_manager"
          args={{ command: "create", path: "/components/" }}
          state="result"
        />
      );

      expect(screen.getByText("Creating /components/")).toBeInTheDocument();
    });

    it("shows generic 'Managing files' message for unknown command", () => {
      render(
        <ToolCallIndicator
          toolName="file_manager"
          args={{ command: "unknown" }}
          state="call"
        />
      );

      expect(screen.getByText("Managing files")).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("handles missing args gracefully", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={null}
          state="call"
        />
      );

      expect(screen.getByText("str_replace_editor")).toBeInTheDocument();
    });

    it("handles undefined args gracefully", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={undefined}
          state="call"
        />
      );

      expect(screen.getByText("str_replace_editor")).toBeInTheDocument();
    });
  });

  describe("unknown tool", () => {
    it("shows the tool name for unknown tools", () => {
      render(
        <ToolCallIndicator
          toolName="unknown_tool"
          args={{}}
          state="call"
        />
      );

      expect(screen.getByText("unknown_tool")).toBeInTheDocument();
    });
  });

  describe("state indicators", () => {
    it("shows loading spinner for call state", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="call"
        />
      );

      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("shows success indicator for result state", () => {
      render(
        <ToolCallIndicator
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="result"
        />
      );

      expect(document.querySelector(".bg-emerald-500")).toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
    });
  });
});