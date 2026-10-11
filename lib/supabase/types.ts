// Veritabanı tipleri — supabase/migrations/20261011000001_initial_schema.sql ile eşleşir.
// Şema değiştiğinde `supabase gen types typescript` ile yeniden üretilebilir.

export type BillingCycle =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semi_annual'
  | 'yearly'
  | 'custom'

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'paused'
  | 'cancelled'
  | 'expired'

export type NotificationType =
  | 'payment_due'
  | 'trial_ending'
  | 'price_change'
  | 'system'

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  default_currency: string
  email_notifications: boolean
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  color: string | null
  icon: string | null
  is_default: boolean
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  category_id: string | null
  name: string
  provider: string | null
  amount: number
  currency: string
  billing_cycle: BillingCycle
  custom_interval_days: number | null
  start_date: string
  next_payment_date: string
  auto_renew: boolean
  status: SubscriptionStatus
  trial_end_date: string | null
  description: string | null
  reminder_days: number[]
  cancelled_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type PriceHistory = {
  id: string
  subscription_id: string
  user_id: string
  old_amount: number
  new_amount: number
  currency: string
  note: string | null
  changed_at: string
}

export type Notification = {
  id: string
  user_id: string
  subscription_id: string | null
  type: NotificationType
  title: string
  body: string | null
  scheduled_for: string | null
  dedupe_key: string | null
  read_at: string | null
  email_sent_at: string | null
  created_at: string
}

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type TableDef<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationship[]
}

export type ProfileInsert = Partial<Omit<Profile, 'id'>> & Pick<Profile, 'id'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'is_default' | 'color' | 'icon'> &
  Partial<Pick<Category, 'id' | 'created_at' | 'is_default' | 'color' | 'icon'>>
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>

export type SubscriptionInsert = Pick<
  Subscription,
  'user_id' | 'name' | 'amount' | 'start_date' | 'next_payment_date'
> &
  Partial<
    Omit<Subscription, 'user_id' | 'name' | 'amount' | 'start_date' | 'next_payment_date'>
  >
export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>

export type PriceHistoryInsert = Omit<PriceHistory, 'id' | 'changed_at' | 'note'> &
  Partial<Pick<PriceHistory, 'id' | 'changed_at' | 'note'>>

export type NotificationInsert = Pick<Notification, 'user_id' | 'type' | 'title'> &
  Partial<Omit<Notification, 'user_id' | 'type' | 'title'>>
export type NotificationUpdate = Partial<
  Pick<Notification, 'read_at' | 'email_sent_at'>
>

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, ProfileInsert, ProfileUpdate>
      categories: TableDef<Category, CategoryInsert, CategoryUpdate>
      subscriptions: TableDef<Subscription, SubscriptionInsert, SubscriptionUpdate>
      price_history: TableDef<PriceHistory, PriceHistoryInsert, Record<string, never>>
      notifications: TableDef<Notification, NotificationInsert, NotificationUpdate>
    }
    Views: Record<string, never>
    Functions: {
      delete_own_account: { Args: Record<string, never>; Returns: undefined }
    }
    Enums: {
      billing_cycle: BillingCycle
      subscription_status: SubscriptionStatus
      notification_type: NotificationType
    }
    CompositeTypes: Record<string, never>
  }
}
