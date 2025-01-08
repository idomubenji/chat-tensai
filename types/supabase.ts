export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          status: 'ONLINE' | 'OFFLINE' | 'AWAY'
          role: 'ADMIN' | 'USER'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          created_by_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['channels']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['channels']['Insert']>
      }
      channel_members: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          role_in_channel: 'ADMIN' | 'MEMBER'
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['channel_members']['Row'], 'joined_at'>
        Update: Partial<Database['public']['Tables']['channel_members']['Insert']>
      }
      messages: {
        Row: {
          id: string
          content: string
          created_at: string
          updated_at: string
          channel_id: string
          user_id: string
          parent_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      message_reactions: {
        Row: {
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['message_reactions']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['message_reactions']['Insert']>
      }
      files: {
        Row: {
          id: string
          url: string
          message_id: string
          user_id: string
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['files']['Row'], 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['files']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_status: 'ONLINE' | 'OFFLINE' | 'AWAY'
      user_role: 'ADMIN' | 'USER'
      channel_role: 'ADMIN' | 'MEMBER'
    }
  }
} 