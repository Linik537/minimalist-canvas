export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      financing_requests: {
        Row: {
          amount: number
          consent: boolean
          contacted: boolean
          created_at: string
          down_payment: number
          email: string | null
          id: string
          installments: number
          name: string
          vehicle_id: string | null
          vehicle_text: string | null
          whatsapp: string
        }
        Insert: {
          amount: number
          consent: boolean
          contacted?: boolean
          created_at?: string
          down_payment: number
          email?: string | null
          id?: string
          installments: number
          name: string
          vehicle_id?: string | null
          vehicle_text?: string | null
          whatsapp: string
        }
        Update: {
          amount?: number
          consent?: boolean
          contacted?: boolean
          created_at?: string
          down_payment?: number
          email?: string | null
          id?: string
          installments?: number
          name?: string
          vehicle_id?: string | null
          vehicle_text?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      sell_request_photos: {
        Row: {
          created_at: string
          id: string
          request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "sell_request_photos_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sell_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sell_requests: {
        Row: {
          asking_price: number
          brand: string
          color: string
          consent: boolean
          contacted: boolean
          created_at: string
          email: string | null
          id: string
          mileage: number
          model: string
          name: string
          notes: string | null
          type: string
          whatsapp: string
          year: number
        }
        Insert: {
          asking_price: number
          brand: string
          color: string
          consent: boolean
          contacted?: boolean
          created_at?: string
          email?: string | null
          id?: string
          mileage: number
          model: string
          name: string
          notes?: string | null
          type: string
          whatsapp: string
          year: number
        }
        Update: {
          asking_price?: number
          brand?: string
          color?: string
          consent?: boolean
          contacted?: boolean
          created_at?: string
          email?: string | null
          id?: string
          mileage?: number
          model?: string
          name?: string
          notes?: string | null
          type?: string
          whatsapp?: string
          year?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_photos: {
        Row: {
          created_at: string
          id: string
          position: number
          storage_path: string
          url: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          storage_path: string
          url: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          storage_path?: string
          url?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          color: string
          created_at: string
          description: string
          drivetrain: string
          engine: string
          featured: boolean
          features: string[]
          fuel: string
          id: string
          manufacture_year: number
          mileage: number
          model: string
          model_year: number
          price: number
          slug: string
          status: string
          transmission: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          brand: string
          color?: string
          created_at?: string
          description?: string
          drivetrain?: string
          engine?: string
          featured?: boolean
          features?: string[]
          fuel?: string
          id?: string
          manufacture_year: number
          mileage?: number
          model: string
          model_year: number
          price: number
          slug: string
          status?: string
          transmission?: string
          type: string
          updated_at?: string
          version?: string
        }
        Update: {
          brand?: string
          color?: string
          created_at?: string
          description?: string
          drivetrain?: string
          engine?: string
          featured?: boolean
          features?: string[]
          fuel?: string
          id?: string
          manufacture_year?: number
          mileage?: number
          model?: string
          model_year?: number
          price?: number
          slug?: string
          status?: string
          transmission?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
