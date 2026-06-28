export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          telegram_chat_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          telegram_chat_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          telegram_chat_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "member" | "viewer";
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          description: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          color?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: "owner" | "manager" | "member" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: "owner" | "manager" | "member" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: "owner" | "manager" | "member" | "viewer";
          updated_at?: string;
        };
        Relationships: [];
      };
      task_statuses: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          slug: string;
          color: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          slug: string;
          color?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          color?: string | null;
          position?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          status_id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          reporter_id: string | null;
          due_date: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          status_id: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          reporter_id?: string | null;
          due_date?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status_id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          reporter_id?: string | null;
          due_date?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          position?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          task_id: string | null;
          comment_id: string | null;
          uploaded_by: string;
          file_url: string;
          file_name: string;
          file_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          comment_id?: string | null;
          uploaded_by: string;
          file_url: string;
          file_name: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          file_url?: string;
          file_name?: string;
          file_type?: string | null;
          file_size?: number | null;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          project_id: string | null;
          task_id: string | null;
          user_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
          user_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          project_id: string | null;
          task_id: string | null;
          title: string;
          body: string | null;
          channel: "app" | "telegram";
          delivery_status: "pending" | "sent" | "failed";
          error_message: string | null;
          sent_at: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
          title: string;
          body?: string | null;
          channel?: "app" | "telegram";
          delivery_status?: "pending" | "sent" | "failed";
          error_message?: string | null;
          sent_at?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          delivery_status?: "pending" | "sent" | "failed";
          error_message?: string | null;
          sent_at?: string | null;
          is_read?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
