import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  guestMessageCount: number;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  incrementGuestMessage: () => Promise<boolean>;
  canGuestSendMessage: () => boolean;
  updateAvatar: (uri: string) => Promise<{ url: string | null; error: any }>;
  updateUsername: (username: string) => Promise<{ success: boolean; error: any }>;
  getProfile: () => Promise<{ username: string | null; avatar_url: string | null }>;
  getAuthToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_LIMIT = 5;
const GUEST_SESSION_KEY = 'vortex_guest_session';

interface GuestSession {
  guestId: string;
  messageCount: number;
  lastReset: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        checkGuestSession();
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        setIsGuest(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkGuestSession = async () => {
    try {
      const data = await AsyncStorage.getItem(GUEST_SESSION_KEY);
      if (data) {
        const guestSession: GuestSession = JSON.parse(data);
        // Check if we need to reset daily count
        const lastReset = new Date(guestSession.lastReset);
        const now = new Date();
        if (lastReset.toDateString() !== now.toDateString()) {
          // New day, reset count
          guestSession.messageCount = 0;
          guestSession.lastReset = now.toISOString();
          await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession));
        }
        setGuestMessageCount(guestSession.messageCount);
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Error checking guest session:', error);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    // Generate username from email if not provided
    const displayName = username || email.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: displayName,
          full_name: displayName,
        }
      }
    });

    // Also insert/update profile directly to ensure it's saved
    if (data?.user && !error) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: displayName,
        full_name: displayName,
        updated_at: new Date().toISOString(),
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'vortexai://auth/callback',
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const updateAvatar = async (uri: string): Promise<{ url: string | null; error: any }> => {
    if (!user) return { url: null, error: new Error('No user logged in') };

    console.log('=== Starting Avatar Upload ===');
    console.log('URI:', uri);
    console.log('User ID:', user.id);

    try {
      // Read file as blob
      console.log('Step 1: Fetching file...');
      const response = await fetch(uri);
      console.log('Step 1: Fetch response status:', response.status);

      const blob = await response.blob();
      console.log('Step 2: Blob created, size:', blob.size, 'type:', blob.type);

      // Convert blob to base64 using FileReader (React Native compatible)
      console.log('Step 3: Converting to base64...');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      console.log('Step 3: Base64 created, length:', base64.length);

      // Determine file extension from MIME type or default to jpg
      let fileExt = 'jpg';
      let contentType = 'image/jpeg';

      if (blob.type && blob.type.startsWith('image/')) {
        contentType = blob.type;
        const mimeToExt: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
        };
        fileExt = mimeToExt[blob.type] || 'jpg';
      }

      const filePath = `${user.id}/avatar.${fileExt}`;

      console.log('Step 4: Uploading to Supabase...', { filePath, contentType });

      // Decode base64 to Uint8Array for upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload using Uint8Array (works on React Native)
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, bytes, {
          upsert: true,
          contentType: contentType,
        });

      console.log('Step 5: Upload response:', { data, error: uploadError });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        return { url: null, error: uploadError };
      }

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      console.log('Step 6: Public URL:', urlWithCacheBust);

      // Update profile with avatar URL
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: urlWithCacheBust,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile Update Error:', profileError);
        return { url: null, error: profileError };
      }

      console.log('=== Avatar Upload SUCCESS ===');
      return { url: urlWithCacheBust, error: null };
    } catch (error) {
      console.error('=== Avatar Upload FAILED ===', error);
      return { url: null, error };
    }
  };

  const updateUsername = async (username: string): Promise<{ success: boolean; error: any }> => {
    if (!user) return { success: false, error: new Error('No user logged in') };

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.trim(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        return { success: false, error: profileError };
      }

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { username: username.trim() }
      });

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  };

  const getProfile = async (): Promise<{ username: string | null; avatar_url: string | null }> => {
    if (!user) return { username: null, avatar_url: null };

    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      return {
        username: data?.username || user.email?.split('@')[0] || null,
        avatar_url: data?.avatar_url || null
      };
    } catch {
      return { username: user.email?.split('@')[0] || null, avatar_url: null };
    }
  };

  const continueAsGuest = async () => {
    const guestSession: GuestSession = {
      guestId: `guest_${Date.now()}`,
      messageCount: 0,
      lastReset: new Date().toISOString(),
    };
    await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession));
    setGuestMessageCount(0);
    setIsGuest(true);
  };

  const canGuestSendMessage = (): boolean => {
    return guestMessageCount < GUEST_LIMIT;
  };

  const incrementGuestMessage = async (): Promise<boolean> => {
    if (!canGuestSendMessage()) {
      return false;
    }

    try {
      const data = await AsyncStorage.getItem(GUEST_SESSION_KEY);
      if (data) {
        const guestSession: GuestSession = JSON.parse(data);
        guestSession.messageCount += 1;
        await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession));
        setGuestMessageCount(guestSession.messageCount);
      }
      return true;
    } catch (error) {
      console.error('Error incrementing guest message:', error);
      return false;
    }
  };

  // Get auth token for API calls (user.id or guest_<id>)
  const getAuthToken = async (): Promise<string> => {
    // If logged in user, return user ID
    if (user?.id) {
      return user.id;
    }

    // If guest, return guest token
    if (isGuest) {
      try {
        const data = await AsyncStorage.getItem(GUEST_SESSION_KEY);
        if (data) {
          const guestSession: GuestSession = JSON.parse(data);
          return `guest_${guestSession.guestId}`;
        }
      } catch (error) {
        console.error('Error getting guest token:', error);
      }
    }

    return 'guest_default';
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isGuest,
        guestMessageCount,
        signUp,
        signIn,
        signInWithMagicLink,
        signOut,
        continueAsGuest,
        incrementGuestMessage,
        canGuestSendMessage,
        updateAvatar,
        updateUsername,
        getProfile,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const GUEST_MESSAGE_LIMIT = GUEST_LIMIT;
