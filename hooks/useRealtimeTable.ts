import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * useRealtimeTable
 * Fetches from an API route and subscribes to Supabase Realtime
 * for the given table. Any INSERT/UPDATE/DELETE triggers a refetch,
 * so all collaborators see changes instantly.
 */
export function useRealtimeTable<T>(apiUrl: string, table: string) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(apiUrl);
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch {
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchData();

        const supabase = createClient();
        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                () => {
                    // Any change → refetch from API
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, table]);

    return { data, isLoading, refresh: fetchData };
}
