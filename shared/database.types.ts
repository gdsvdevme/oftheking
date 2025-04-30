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
      appointment_services: {
        Row: {
          id: string
          appointment_id: string
          service_id: string
          price: string
          final_price: string | null
        }
        Insert: {
          id?: string
          appointment_id: string
          service_id: string
          price: string
          final_price?: string | null
        }
        Update: {
          id?: string
          appointment_id?: string
          service_id?: string
          price?: string
          final_price?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          start_time: string
          end_time: string
          status: string
          notes: string | null
          created_at: string | null
          created_by: string | null
          final_price: string | null
          recurrence: string | null
          payment_date: string | null
          payment_status: string
        }
        Insert: {
          id?: string
          client_id: string
          start_time: string
          end_time: string
          status?: string
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
          final_price?: string | null
          recurrence?: string | null
          payment_date?: string | null
          payment_status?: string
        }
        Update: {
          id?: string
          client_id?: string
          start_time?: string
          end_time?: string
          status?: string
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
          final_price?: string | null
          recurrence?: string | null
          payment_date?: string | null
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      blocked_schedules: {
        Row: {
          id: string
          start_time: string
          end_time: string
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          start_time: string
          end_time: string
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          start_time?: string
          end_time?: string
          reason?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          name: string
          phone: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_transactions: {
        Row: {
          id: string
          transaction_date: string
          description: string
          amount: string
          type: string
          category: string | null
          related_sale_id: string | null
          related_appointment_id: string | null
          payment_method: string | null
          notes: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          transaction_date?: string
          description: string
          amount: string
          type: string
          category?: string | null
          related_sale_id?: string | null
          related_appointment_id?: string | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          transaction_date?: string
          description?: string
          amount?: string
          type?: string
          category?: string | null
          related_sale_id?: string | null
          related_appointment_id?: string | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_related_appointment_id_fkey"
            columns: ["related_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_related_sale_id_fkey"
            columns: ["related_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory: {
        Row: {
          id: string
          name: string
          quantity: number
          cost_price: string
          selling_price: string
          created_at: string | null
          created_by: string | null
          category: string | null
        }
        Insert: {
          id?: string
          name: string
          quantity?: number
          cost_price?: string
          selling_price?: string
          created_at?: string | null
          created_by?: string | null
          category?: string | null
        }
        Update: {
          id?: string
          name?: string
          quantity?: number
          cost_price?: string
          selling_price?: string
          created_at?: string | null
          created_by?: string | null
          category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          inventory_id: string
          quantity: number
          unit_price: string
          total_price: string
        }
        Insert: {
          id?: string
          sale_id: string
          inventory_id: string
          quantity?: number
          unit_price?: string
          total_price?: string
        }
        Update: {
          id?: string
          sale_id?: string
          inventory_id?: string
          quantity?: number
          unit_price?: string
          total_price?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          id: string
          sale_date: string
          total_amount: string
          payment_method: string | null
          notes: string | null
          created_at: string | null
          created_by: string | null
          client_id: string | null
        }
        Insert: {
          id?: string
          sale_date?: string
          total_amount?: string
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
          client_id?: string | null
        }
        Update: {
          id?: string
          sale_date?: string
          total_amount?: string
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
          client_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          name: string
          price: string
          duration: number
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          price?: string
          duration?: number
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          price?: string
          duration?: number
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          role?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: string | null
          created_at?: string
          updated_at?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}