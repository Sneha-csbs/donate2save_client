import React, { createContext, useContext, useState, useEffect } from 'react';
import { appointmentAPI, donorAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AppointmentContext = createContext();

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [donorHistory, setDonorHistory] = useState([]);
  const [donorStats, setDonorStats] = useState({});
  const [donorBadges, setDonorBadges] = useState({});
  const [donorCertificates, setDonorCertificates] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch appointments on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentAPI.getUserAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorData = async () => {
    try {
      if (user?.role !== 'donor') return;
      
      const [history, stats] = await Promise.all([
        donorAPI.getHistory(),
        donorAPI.getStats()
      ]);
      
      // Update donor history as array for the authenticated donor
      setDonorHistory(history);
      setDonorStats(prev => ({ ...prev, [user.id]: stats }));
      
      // Generate certificates from history
      const certificates = history.map(h => ({
        id: h._id,
        date: h.date,
        place: h.place,
        units: h.units
      }));
      setDonorCertificates(prev => ({ ...prev, [user.id]: certificates }));
      
      // Generate badges based on total donations
      const badges = [];
      if (stats.totalDonations >= 1) badges.push("🏆 First Donation");
      if (stats.totalDonations >= 3) badges.push("🥉 Bronze Donor");
      if (stats.totalDonations >= 10) badges.push("🥈 Silver Donor");
      if (stats.totalDonations >= 25) badges.push("🥇 Gold Donor");
      if (stats.totalDonations >= 50) badges.push("👑 Lifetime Donor");
      setDonorBadges(prev => ({ ...prev, [user.id]: badges }));
      
    } catch (error) {
      console.error('Failed to fetch donor data:', error);
    }
  };

  const addAppointment = async (appointment) => {
    try {
      // Add requesterId to appointment data if not already provided
      const appointmentData = {
        ...appointment,
        requesterId: appointment.requesterId || user?.id // Use provided requesterId or authenticated user's ID
      };
      
      const data = await appointmentAPI.create(appointmentData);
      setAppointments(prev => [data.data, ...prev]);
      
      // Add notification for requester if appointment has date/time
      if (appointment.date && appointment.time) {
        addNotification({
          id: Date.now() + 1,
          type: "appointment_scheduled",
          message: `New appointment scheduled with ${appointment.donor} for ${appointment.date} at ${appointment.time}`,
          requestId: appointment.requestId,
          read: false,
          timestamp: new Date().toISOString()
        });
      }
      return data.data;
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw error;
    }
  };

  const updateAppointmentStatus = async (appointmentId, status, updates = {}) => {
    try {
      const data = await appointmentAPI.updateStatus(appointmentId, status);
      setAppointments(prev => prev.map(apt => 
        apt._id === appointmentId ? { ...apt, ...data, ...updates } : apt
      ));

      if (status === "Completed") {
        const appointment = appointments.find(apt => apt._id === appointmentId);
        if (appointment && user?.role === 'donor' && appointment.donorId === user.id) {
          // Refresh donor data after completion for the authenticated donor
          setTimeout(() => {
            fetchDonorData();
          }, 1000); // Small delay to ensure backend has processed
        }
      }
      return data;
    } catch (error) {
      console.error('Failed to update appointment:', error);
      throw error;
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationRead = (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const addDonorHistory = (historyEntry) => {
    setDonorHistory(prev => [historyEntry, ...prev]);
  };

  const updateDonorStats = (donorId) => {
    setDonorStats(prev => ({
      ...prev,
      [donorId]: {
        totalDonations: (prev[donorId]?.totalDonations || 0) + 1,
        thisYear: (prev[donorId]?.thisYear || 0) + 1
      }
    }));
  };

  const addCertificate = (donorId, historyEntry) => {
    setDonorCertificates(prev => ({
      ...prev,
      [donorId]: [...(prev[donorId] || []), {
        id: historyEntry.id,
        date: historyEntry.date,
        place: historyEntry.place,
        units: historyEntry.units
      }]
    }));
  };

  const generateBadges = (donorId) => {
    const stats = donorStats[donorId] || { totalDonations: 0 };
    const newTotal = stats.totalDonations + 1;
    const currentBadges = donorBadges[donorId] || [];
    const newBadges = [...currentBadges];

    // First Donation Badge
    if (newTotal === 1 && !currentBadges.includes("🏆 First Donation")) {
      newBadges.push("🏆 First Donation");
    }

    // Bronze Donor Badge
    if (newTotal >= 3 && !currentBadges.includes("🥉 Bronze Donor")) {
      newBadges.push("🥉 Bronze Donor");
    }

    // Silver Donor Badge
    if (newTotal >= 10 && !currentBadges.includes("🥈 Silver Donor")) {
      newBadges.push("🥈 Silver Donor");
    }

    // Gold Donor Badge
    if (newTotal >= 25 && !currentBadges.includes("🥇 Gold Donor")) {
      newBadges.push("🥇 Gold Donor");
    }

    // Lifetime Donor Badge
    if (newTotal >= 50 && !currentBadges.includes("👑 Lifetime Donor")) {
      newBadges.push("👑 Lifetime Donor");
    }

    setDonorBadges(prev => ({
      ...prev,
      [donorId]: newBadges
    }));
  };

  const checkDonorEligibility = async () => {
    try {
      if (user?.role !== 'donor') {
        return { eligible: false, message: "Not a donor" };
      }
      const eligibility = await donorAPI.checkEligibility();
      return eligibility;
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      return { eligible: true, message: "Eligible to Donate" };
    }
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      notifications,
      donorHistory,
      donorStats,
      donorBadges,
      donorCertificates,
      addAppointment,
      updateAppointmentStatus,
      addNotification,
      markNotificationRead,
      addDonorHistory,
      updateDonorStats,
      addCertificate,
      generateBadges,
      checkDonorEligibility,
      fetchAppointments,
      fetchDonorData,
      loading,
      setAppointments
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};