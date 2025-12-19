import React, { createContext, useContext, useState, useEffect } from 'react';
import { requestAPI } from '../services/api';
import { useAuth } from './AuthContext';

const RequestContext = createContext();

export const useRequests = () => {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequests must be used within a RequestProvider');
  }
  return context;
};

export const RequestProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch requests on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  // Listen for request changes from other users
  useEffect(() => {
    const checkForUpdates = () => {
      const lastDeletion = localStorage.getItem('lastRequestDeletion');
      const lastCreation = localStorage.getItem('lastRequestCreation');
      const lastCheck = localStorage.getItem('lastRequestCheck') || '0';
      
      const latestChange = Math.max(
        parseInt(lastDeletion || '0'),
        parseInt(lastCreation || '0')
      );
      
      if (latestChange > parseInt(lastCheck)) {
        fetchRequests();
        localStorage.setItem('lastRequestCheck', Date.now().toString());
      }
    };

    const interval = setInterval(checkForUpdates, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let data;
      if (user?.role === 'requester') {
        // Requesters see only their own requests
        data = await requestAPI.getUserRequests();
      } else if (user?.role === 'donor') {
        // Donors see all requests to find compatible ones
        data = await requestAPI.getAll();
      } else {
        data = [];
      }
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRequest = async (newRequest) => {
    try {
      const data = await requestAPI.create(newRequest);
      setRequests(prev => [data.data, ...prev]);
      // Trigger a global refresh for all users by storing creation timestamp
      localStorage.setItem('lastRequestCreation', Date.now().toString());
      return data.data;
    } catch (error) {
      console.error('Failed to create request:', error);
      throw error;
    }
  };

  const updateRequest = async (id, updates) => {
    try {
      const data = await requestAPI.update(id, updates);
      setRequests(prev => prev.map(req => 
        req._id === id ? data : req
      ));
      return data;
    } catch (error) {
      console.error('Failed to update request:', error);
      throw error;
    }
  };

  const deleteRequest = async (id) => {
    try {
      await requestAPI.delete(id);
      setRequests(prev => prev.filter(req => req._id !== id));
      // Trigger a global refresh for all users by storing deletion timestamp
      localStorage.setItem('lastRequestDeletion', Date.now().toString());
    } catch (error) {
      console.error('Failed to delete request:', error);
      throw error;
    }
  };

  return (
    <RequestContext.Provider value={{
      requests,
      loading,
      addRequest,
      updateRequest,
      deleteRequest,
      fetchRequests,
      setRequests
    }}>
      {children}
    </RequestContext.Provider>
  );
};