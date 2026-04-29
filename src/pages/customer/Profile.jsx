import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, MapPin, Phone, User, Clock } from 'lucide-react';

const Profile = () => {
  const { currentUser } = useAuth();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');

  const handleSaveReminder = (e) => {
    e.preventDefault();
    // Here we would save to Firestore 'Reminders' collection
    console.log("Reminder saved:", { enabled: reminderEnabled, time: reminderTime, repeat: 'Daily' });
    alert('Reminder settings saved successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto pb-16 animate-fade-in">
      <h2 className="mb-6">My Profile</h2>
      
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <User size={32} />
        </div>
        <div>
          <h3 className="font-bold">{currentUser?.name || 'Customer'}</h3>
          <p className="text-muted flex items-center gap-1 mt-1">
            <Phone size={14} /> {currentUser?.phone || currentUser?.phoneNumber || 'No phone number'}
          </p>
        </div>
      </div>

      <div className="card mb-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-primary" size={24} />
          <h3 className="font-bold text-lg">Daily Order Reminder</h3>
        </div>
        <p className="text-sm text-muted mb-4">
          Never forget to order your fresh paneer. Set a daily reminder and we'll notify you!
        </p>
        
        <form onSubmit={handleSaveReminder} className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
            <span className="font-medium">Enable Reminder</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={reminderEnabled}
                onChange={() => setReminderEnabled(!reminderEnabled)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {reminderEnabled && (
            <div className="flex flex-col gap-2 animate-fade-in">
              <label className="text-sm font-medium">Reminder Time</label>
              <div className="flex items-center gap-2">
                <Clock className="text-gray-400" size={20} />
                <input 
                  type="time" 
                  className="input-field max-w-[150px]"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full mt-2">
            Save Settings
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary" size={24} />
            <h3 className="font-bold text-lg">Saved Addresses</h3>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {/* Mock Addresses */}
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
            <p className="font-medium">123 Dairy Lane, Milk City</p>
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full mt-2 inline-block">Default</span>
          </div>
          <div className="p-3 border border-gray-200 rounded-md">
            <p className="font-medium">456 Farm Road, Cow Town</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
