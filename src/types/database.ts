export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          city: string | null;
          category: string | null;
          referral_code: string;
          total_referrals: number;
          total_earnings: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          city?: string | null;
          category?: string | null;
          referral_code: string;
          total_referrals?: number;
          total_earnings?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          city?: string | null;
          category?: string | null;
          referral_code?: string;
          total_referrals?: number;
          total_earnings?: number;
          status?: string;
          created_at?: string;
        };
      };
      surveys: {
        Row: {
          id: string;
          title: string;
          category: string | null;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category?: string | null;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string | null;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      respondents: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          city: string | null;
          category: string | null;
          source: string;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          city?: string | null;
          category?: string | null;
          source?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          city?: string | null;
          category?: string | null;
          source?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          respondent_id: string | null;
          survey_id: string | null;
          referral_code: string;
          status: string;
          lead_date: string;
          fit_date: string | null;
          completion_date: string | null;
          payout_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          respondent_id?: string | null;
          survey_id?: string | null;
          referral_code: string;
          status?: string;
          lead_date?: string;
          fit_date?: string | null;
          completion_date?: string | null;
          payout_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          respondent_id?: string | null;
          survey_id?: string | null;
          referral_code?: string;
          status?: string;
          lead_date?: string;
          fit_date?: string | null;
          completion_date?: string | null;
          payout_amount?: number;
          created_at?: string;
        };
      };
    };
  };
}

export type Member = Database['public']['Tables']['members']['Row'];
export type Survey = Database['public']['Tables']['surveys']['Row'];
export type Respondent = Database['public']['Tables']['respondents']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];

export interface ReferralWithDetails extends Referral {
  referrer?: Member;
  respondent?: Respondent;
  survey?: Survey;
}
