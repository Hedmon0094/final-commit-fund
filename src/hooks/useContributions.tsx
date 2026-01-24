import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { TARGET_AMOUNT, TOTAL_MEMBERS } from '@/lib/constants';

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
}

// Public profile interface (excludes sensitive data)
interface PublicProfile {
  id: string;
  user_id: string;
  name: string;
  is_treasurer: boolean;
  created_at: string;
}

interface MemberWithContributions {
  profile: PublicProfile;
  totalPaid: number;
  contributions: Contribution[];
}

export function useMyContributions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-contributions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contribution[];
    },
    enabled: !!user,
  });
}

export function useMyTotal() {
  const { data: contributions = [] } = useMyContributions();
  return contributions.reduce((sum, c) => sum + c.amount, 0);
}

export function useAllMembersWithContributions() {
  const { profile } = useAuth();
  const isTreasurer = profile?.is_treasurer ?? false;

  return useQuery({
    queryKey: ['all-members-contributions', isTreasurer],
    queryFn: async () => {
      // Use public_profiles view to get only non-sensitive profile data
      // Cast to unknown first since view isn't in generated types yet
      const { data: profiles, error: profileError } = await supabase
        .from('public_profiles' as 'profiles')
        .select('id, user_id, name, is_treasurer, created_at')
        .order('name');

      if (profileError) throw profileError;

      // Get all contributions
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('*')
        .eq('status', 'completed');

      if (contribError) throw contribError;

      // Map profiles with their contributions
      const members: MemberWithContributions[] = (profiles as PublicProfile[]).map(profile => {
        const memberContributions = (contributions as Contribution[]).filter(
          c => c.user_id === profile.user_id
        );
        const totalPaid = memberContributions.reduce((sum, c) => sum + c.amount, 0);

        return {
          profile,
          totalPaid,
          contributions: memberContributions,
        };
      });

      return members;
    },
    // Prevents query execution for non-treasurers (RLS will still enforce server-side)
    enabled: isTreasurer,
  });
}

// Hook for real-time contribution updates subscription
export function useContributionsRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isInitialMount = useRef(true);

  useEffect(() => {
    console.log('Setting up real-time subscription for contributions');
    
    // Skip toast on initial mount
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 2000);
    
    const channel = supabase
      .channel('public-contributions-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'contributions',
        },
        (payload) => {
          console.log('Real-time contribution update:', payload.eventType);
          
          // Show toast for new contributions (not from current user, after initial mount)
          if (
            payload.eventType === 'INSERT' && 
            !isInitialMount.current &&
            payload.new &&
            (payload.new as { user_id?: string; amount?: number }).user_id !== user?.id
          ) {
            const newContribution = payload.new as { amount: number };
            toast({
              title: "New Contribution! 🎉",
              description: `Someone just contributed KES ${newContribution.amount.toLocaleString()}`,
            });
          }
          
          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ['public-stats'] });
          queryClient.invalidateQueries({ queryKey: ['my-contributions'] });
          queryClient.invalidateQueries({ queryKey: ['all-members-contributions'] });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);
}

// Public stats hook - queries aggregate data without requiring treasurer role
export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      // Get count of members who have joined (profiles created)
      // Using the public_profiles view which bypasses RLS
      const { data: profiles, error: memberError } = await supabase
        .from('public_profiles' as 'profiles')
        .select('user_id');

      if (memberError) {
        console.error('Error fetching profiles:', memberError);
        throw memberError;
      }

      const memberCount = profiles?.length || 0;

      // Get total collected from all completed contributions
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('amount, user_id')
        .eq('status', 'completed');

      if (contribError) {
        console.error('Error fetching contributions:', contribError);
        throw contribError;
      }

      const totalCollected = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      
      // Calculate unique users who have completed their target
      const userTotals = new Map<string, number>();
      contributions?.forEach(c => {
        const current = userTotals.get(c.user_id) || 0;
        userTotals.set(c.user_id, current + c.amount);
      });
      
      let completedCount = 0;
      let inProgressCount = 0;
      userTotals.forEach(total => {
        if (total >= TARGET_AMOUNT) completedCount++;
        else if (total > 0) inProgressCount++;
      });

      const notStartedCount = memberCount - completedCount - inProgressCount;
      const totalTarget = TOTAL_MEMBERS * TARGET_AMOUNT; // Always use fixed total (7,000)

      return {
        totalCollected,
        totalTarget,
        memberCount,
        completedCount,
        inProgressCount,
        notStartedCount: Math.max(0, notStartedCount),
        progressPercentage: totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0,
      };
    },
    staleTime: 5000, // Cache for 5 seconds for more responsive updates
    refetchOnWindowFocus: true,
  });
}

// Treasurer-only detailed stats (uses member data)
export function useGroupStats() {
  const { profile } = useAuth();
  const isTreasurer = profile?.is_treasurer ?? false;
  const { data: members = [] } = useAllMembersWithContributions();

  // For non-treasurers, use public stats
  const { data: publicStats } = usePublicStats();

  if (!isTreasurer) {
    return publicStats || {
      totalCollected: 0,
      totalTarget: TOTAL_MEMBERS * TARGET_AMOUNT,
      memberCount: 0,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      progressPercentage: 0,
    };
  }

  const totalCollected = members.reduce((sum, m) => sum + m.totalPaid, 0);
  const memberCount = members.length;
  const totalTarget = memberCount * TARGET_AMOUNT;
  const completedCount = members.filter(m => m.totalPaid >= TARGET_AMOUNT).length;
  const inProgressCount = members.filter(m => m.totalPaid > 0 && m.totalPaid < TARGET_AMOUNT).length;
  const notStartedCount = members.filter(m => m.totalPaid === 0).length;

  return {
    totalCollected,
    totalTarget,
    memberCount,
    completedCount,
    inProgressCount,
    notStartedCount,
    progressPercentage: totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0,
  };
}

export function useAddContribution() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contributions')
        .insert({
          user_id: user.id,
          amount,
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['all-members-contributions'] });
    },
  });
}

export function getMemberStatus(totalPaid: number): 'completed' | 'in-progress' | 'pending' {
  if (totalPaid >= TARGET_AMOUNT) return 'completed';
  if (totalPaid > 0) return 'in-progress';
  return 'pending';
}
